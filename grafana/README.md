# Grafana Configuration

This directory contains Grafana provisioning configuration for the Bernoulli application.

## Directory Structure

```
grafana/
├── provisioning/
│   ├── datasources/
│   │   └── jaeger.yml          # Jaeger datasource configuration
│   └── dashboards/
│       ├── dashboards.yml       # Dashboard provider configuration
│       └── definitions/
│           └── bernoulli-api-overview.json  # Pre-built trace dashboard
└── README.md
```

## Provisioning

Grafana automatically loads configuration from the `provisioning/` directory on startup:

- **Datasources**: Auto-configures the Jaeger datasource at `http://jaeger:16686`
- **Dashboards**: Auto-loads dashboards from `provisioning/dashboards/definitions/`

## Adding New Dashboards

To add a new dashboard:

1. Create the dashboard in Grafana UI
2. Export as JSON (Dashboard settings → JSON Model)
3. Save to `provisioning/dashboards/definitions/your-dashboard.json`
4. Restart Grafana: `docker compose restart grafana`

The dashboard will be automatically loaded on next startup.

## Modifying Datasources

To modify the Jaeger datasource:

1. Edit `provisioning/datasources/jaeger.yml`
2. Restart Grafana: `docker compose restart grafana`

## Documentation

For detailed information about Grafana integration, see:

- `private_/docs/GRAFANA.md` - Complete integration documentation
- `CLAUDE.md` - Quick reference and usage
