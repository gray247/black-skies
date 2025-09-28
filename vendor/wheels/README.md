# Wheel Cache Directory

This directory stores pre-downloaded Python package wheels used by the
`scripts/freeze_wheels.sh` helper. Run the script to populate this folder with
artifacts from `requirements.lock` and `requirements.dev.lock`. The directory is
checked into version control to ensure collaborators share the same cache path
while remaining empty by default.

