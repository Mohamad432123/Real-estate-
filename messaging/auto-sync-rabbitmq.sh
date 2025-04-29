#!/bin/bash

WATCH_DIR="/home/bryan/Capstone-Group-01/messaging"

# List of remote targets
REMOTE_TARGETS=(
  "root@it490:/home/leo/Capstone-Group-01/messaging/"
  "root@MohamadAl:/home/mohamad/Desktop/Capstone-Group-01/messaging/"
)

DELAY =3

echo -e "\nWatching $WATCH_DIR for changes... (Press Ctrl+C to stop)\n"

while inotifywait -r -e modify,create,delete $WATCH_DIR; do
    echo "Change detected! Syncing to all remote nodes..."

    for TARGET in "${REMOTE_TARGETS[@]}"; do
        echo "Syncing changes to $TARGET"
        rsync -avz --delete "$WATCH_DIR/" $TARGET && echo "Successfully synced to $TARGET" || echo "Failed to sync to $TARGET" &
    done

    wait
    echo "All syncs completed.\n"
done
