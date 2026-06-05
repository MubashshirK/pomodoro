"""Gunicorn entrypoint for production deployments (Railway, Render, etc.)

Usage:  gunicorn wsgi:application --bind 0.0.0.0:$PORT

The `application` alias is what most PaaS docs (Heroku, Render) expect;
`app` is kept as an alias for `flask run` compatibility.
"""
from app import create_app

application = create_app()
app = application
