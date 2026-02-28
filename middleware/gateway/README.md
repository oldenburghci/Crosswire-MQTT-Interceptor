### Local Development Setup

The golang tool chain is required for a local development setup.
You find the installation package for your distribution here https://go.dev/doc/install. 
We developed with version `go1.23.4`. 

The gateway component has configurable settings which are configured through environment variables. 
We provide a template file in `config/env.example` for you.
Prepare the variables accordingly for your local deployment and execute 

```bash
    source <path/to/your/local/config.file>
```

to map the variables into your local environment.

Change the code and run 

```bash
  go run cmd/main.go
```

to start the component locally. 

