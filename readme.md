
---

# GitLab-Docker Tool Suite

This README covers the details of the two web interfaces we have developed to aid with GitLab repository and Docker container management.

## 1. Deploy App (from `env.html`)

### Overview

This tool provides a visual interface for deploying and managing Docker containers directly from GitLab repositories.

### Features

- **Repository Listing:** Lists all pre-configured GitLab repositories.
- **Branch Selection:** For each repository, users can select a specific branch for deployment.
- **Container Status:** Shows the status of the Docker container for each repository.
- **Deployment:** Deploys the selected branch of a repository as a Docker container.
- **Container Removal:** Offers an option to remove an existing Docker container.

### User Guide

1. On accessing the tool, all pre-configured repositories are listed in a table.
2. For each repository, the available branches can be selected from a dropdown menu.
3. Clicking the 'Deploy' button deploys the selected branch as a Docker container.
4. The status of each Docker container is shown (e.g., up, down, exited).
5. Containers that are not in an 'up' status can be deployed directly from the interface.
6. The 'Remove Container' button removes a container if it's no longer needed.

## 2. Environment Management (from `env2.html`)

### Overview

This interface allows users to view and manage environment variables of running Docker containers.

### Features

- **Container Selection:** Users can select from a list of running Docker containers.
- **Environment Variable Display:** For each container, environment variables can be fetched and displayed in a text area.
- **Environment Variable Update:** Users can modify the environment variables and update them for the container.

### User Guide

1. From the dropdown, select a running Docker container whose environment variables you wish to view or modify.
2. Click the 'Fetch Environment Variables' button. This displays the current environment variables in the text area.
3. To modify environment variables, edit the content in the text area.
4. Click the 'Update Environment Variables' button to save the changes.

### Note

- The tool automatically updates the list of running containers every 10 seconds to reflect any changes in their statuses.

---

### Installation and Usage

1. Clone the repository:
   ```
   git clone github.com:jspawar80/GitLab-Docker-Tool-.git
   ```

2. Navigate to the cloned directory:
   ```
   cd gitlab-docker-tool
   ```

3. Run the necessary services (assuming you have a setup script or instructions specific to your system).

4. Access the tools via the configured URLs on your browser.

To deploy the Application
```
http://localhost:4000/env
```

TO edit and update the env

```
http://localhost:4000/env2
```

---

