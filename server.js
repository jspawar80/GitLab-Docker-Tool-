const express = require('express');
const bodyParser = require('body-parser');
const { exec } = require('child_process');

const app = express();
const PORT = 4000;

// Middleware to parse JSON requests
app.use(bodyParser.json());

app.post('/deploy', (req, res) => {
    const { repo, branch } = req.body;

    if (!repo || !branch) {
        return res.status(400).send('Repo or branch not provided.');
    }

    const repoName = repo.split(':').pop().split('/').pop().replace('.git', '');

    const commands = [
        `cd /tmp`,
        `test -d ${repoName} || git clone ${repo}`,  // Clone only if directory doesn't exist
        `cd ${repoName}`,
        `git checkout ${branch}`,
        `git pull origin ${branch}`,  // Pull latest changes
        `sudo chmod +x localstack.sh`,     // Grant execute permissions
        `sudo ./localstack.sh intelliflow/${repoName}  ${repoName}`
    ];

    // Execute the shell commands
    exec(commands.join(' && '), (error, stdout, stderr) => {
        if (error) {
            console.error(`exec error: ${error}`);
            console.error(`stderr: ${stderr}`);
            return res.status(500).send('Failed to deploy');
        }
        console.log(`stdout: ${stdout}`);

        // Get port information
        const portCommand = `sudo docker port ${repoName}`;
        exec(portCommand, (portError, portStdout) => {
            if (portError) {
                console.error(`portError: ${portError}`);
                return res.status(500).send('Failed to get port');
            }
            res.send({ message: 'Deployed successfully', portInfo: `localhost:${portStdout.trim()}` });
        });
    });
});

app.post('/fetch-env', (req, res) => {
    const { repoName } = req.body;

    if (!repoName) {
        return res.status(400).send('Repo name not provided.');
    }

    const envCommand = `sudo docker exec ${repoName} printenv`;
    exec(envCommand, (error, stdout) => {
        if (error) {
            console.error(`exec error: ${error}`);
            return res.status(500).send('Failed to fetch environment variables');
        }
        const envData = stdout.split('\n').filter(line => line);
        res.json(envData);
    });
});

app.post('/update-envv', (req, res) => {
    const { repoName, env } = req.body;

    if (!repoName || !env) {
        console.error('Repo name or environment variables not provided.');
        return res.status(400).send('Repo name or environment variables not provided.');
    }

    // Filter out any invalid or empty environment variables
    const validEnvVars = env.filter(e => e && e.includes('='));

    // Convert the env array to a string format suitable for Docker
    const envString = validEnvVars.map(e => `-e "${e.trim()}"`).join(' ');

    const command = `
        sudo docker stop ${repoName} &&
        sudo docker rm ${repoName} &&
        cd /tmp/${repoName} &&
        sudo docker run -d --name ${repoName} ${envString} -v $(pwd):/app intelliflow/${repoName}
    `;

    console.log(`Executing command: ${command}`);

    exec(command, (error) => {
        if (error) {
            console.error(`exec error: ${error}`);
            return res.status(500).send('Failed to update environment variables');
        }
        res.send('Environment variables updated successfully');
    });
});


app.post('/update-env', (req, res) => {
    const { repoName, env } = req.body;

    if (!repoName || !env) {
        console.error('Repo name or environment variables not provided.');
        return res.status(400).send('Repo name or environment variables not provided.');
    }

    // Convert the env array to a string format suitable for Docker
    const envString = env.map(e => `-e "${e.trim()}"`).join(' ');

    const command = `
        sudo docker stop ${repoName} &&
        sudo docker rm ${repoName} &&
        cd /tmp/${repoName} &&
        sudo docker run -d --name ${repoName} ${envString} -v $(pwd):/app intelliflow/${repoName}
    `;

    console.log(`Executing command: ${command}`);

    exec(command, (error) => {
        if (error) {
            console.error(`exec error: ${error}`);
            return res.status(500).send('Failed to update environment variables');
        }
        res.send('Environment variables updated successfully');
    });
});

// app.get('/branches', (req, res) => {
//     const { repoName } = req.query;

//     if (!repoName) {
//         return res.status(400).send('Repo name not provided.');
//     }

//     const command = `
//         git clone ${repo} &&
//         cd ${repo} &&
//         git fetch &&
//         git branch -r
//     `;

//     exec(command, (error, stdout) => {
//         if (error) {
//             console.error(`exec error: ${error}`);
//             return res.status(500).send('Failed to fetch branches');
//         }
//         const branches = stdout.split('\n')
//                                .filter(line => line)
//                                .map(branch => branch.replace('origin/', '').trim());
//         res.json(branches);
//     });
// });

app.get('/env2', (req, res) => {
    res.sendFile(__dirname + '/public/env2.html');
});

app.get('/env', (req, res) => {
    res.sendFile(__dirname + '/public/env.html');
});


app.get('/branches', (req, res) => {
    const { repoName } = req.query;

    if (!repoName) {
        return res.status(400).send('Repo name not provided.');
    }

    const command = `git ls-remote --heads   ${repoName}`;

    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error(`exec error: ${error}`);
            return res.status(500).send('Failed to fetch branches');
        }

        const branches = stdout
            .split('\n')
            .filter(line => line)
            .map(line => {
                const parts = line.split(/\s+/);
                return parts[1].replace('refs/heads/', '');
            });

        res.json(branches);
    });
});

app.get('/env-containers', (req, res) => {
    const { repoName } = req.query;

    let command = 'sudo docker ps --format "{{.Names}} ({{.Status}})"';  // Only fetch running containers
    if (repoName) {
        command = `sudo docker ps --filter "name=${repoName}" --format "{{.Names}} ({{.Status}})"`;
    }

    exec(command, (error, stdout) => {
        if (error) {
            console.error(`exec error: ${error}`);
            return res.status(500).send('Failed to fetch containers');
        }
        const containers = stdout.split('\n').filter(line => line && line.includes("Up"));
        const containersData = containers.map(container => {
            const [name, status] = container.split(' (');
            return { name, status: status.replace(')', '') };
        });
        res.json(containersData);
    });
});


app.get('/containers', (req, res) => {
    const { repoName } = req.query;

    let command = 'sudo docker ps -a --format "{{.Names}} ({{.Status}})"';
    if (repoName) {
        command = `sudo docker ps -a --filter "name=${repoName}" --format "{{.Names}} ({{.Status}})"`;
    }

    exec(command, (error, stdout) => {
        if (error) {
            console.error(`exec error: ${error}`);
            return res.status(500).send('Failed to fetch containers');
        }
        const containers = stdout.split('\n').filter(line => line);
        if (repoName && containers.length) {
            const [name, status] = containers[0].split(' (');
            return res.json({ name, status: status.replace(')', '') });
        }
        const containersData = containers.map(container => {
            const [name, status] = container.split(' (');
            return { name, status: status.replace(')', '') };
        });
        res.json(containersData);
    });
});


app.post('/remove-containers', (req, res) => {
    const { repoName } = req.body;

    if (!repoName) {
        return res.status(400).send('Repo name not provided.');
    }

    // Stop and remove the container
    const command = `sudo docker stop ${repoName} && sudo docker rm -f ${repoName}`;

    exec(command, (error) => {
        if (error) {
            console.error(`exec error: ${error}`);
            return res.status(500).send('Failed to remove container');
        }
        res.send('Containers removed successfully');
    });
});

// Serve static files from the public directory
app.use(express.static('public'));

// Start the server
app.listen(PORT, () => {
    console.log(`Server started on http://localhost:${PORT}`);
});
