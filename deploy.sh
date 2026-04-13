#!/bin/bash
set -e

HOST="dns.safa.hugochilemme.com"
PORT="2008"
USER="root"
PASS="M6HiIfM3TiKUJOzv"
REMOTE_DIR="/var/www/stegeas"

echo "→ Nettoyage du serveur..."
sshpass -p "$PASS" ssh -o StrictHostKeyChecking=no "$USER@$HOST" -p "$PORT" "rm -rf $REMOTE_DIR/*"

echo "→ Déploiement..."
sshpass -p "$PASS" scp -o StrictHostKeyChecking=no -P "$PORT" -r ./* "$USER@$HOST:$REMOTE_DIR/"

echo "✓ Déployé sur https://steph.adamzou.fr"
