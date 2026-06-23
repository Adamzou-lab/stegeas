#!/bin/bash
set -e

# Identifiants lus depuis l'environnement, jamais committés.
# Définir les variables avant de lancer le script, par exemple via un fichier .env
# ignoré par git :  set -a; source .env; set +a; ./deploy.sh
: "${SSH_HOST:?Définir SSH_HOST}"
: "${SSH_PORT:?Définir SSH_PORT}"
: "${SSH_USER:?Définir SSH_USER}"
: "${SSH_PASS:?Définir SSH_PASS}"
REMOTE_DIR="/var/www/stegeas"

echo "Nettoyage du serveur..."
sshpass -p "$SSH_PASS" ssh -o StrictHostKeyChecking=no "$SSH_USER@$SSH_HOST" -p "$SSH_PORT" "rm -rf $REMOTE_DIR/*"

echo "Deploiement en cours..."
sshpass -p "$SSH_PASS" scp -o StrictHostKeyChecking=no -P "$SSH_PORT" -r ./* "$SSH_USER@$SSH_HOST:$REMOTE_DIR/"

echo "Deploye sur https://stegeas.com"
