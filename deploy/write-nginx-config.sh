#!/bin/sh

# Check if INGRESS_CONFIG is set and non-empty
if [ -n "$INGRESS_CONFIG" ]; then
    echo "Write custom config"
    echo $INGRESS_CONFIG > /etc/nginx/conf.d/ingress.conf
fi