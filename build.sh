#!/usr/bin/env bash

# Runs the complete set of template combiners.
# Necessary for WebGME to work properly.
# Must be run when ever there has been a change to an *.ejs file.
echo =======================================================
echo Rebuilding templates.
echo =======================================================
declare -a TEMPLATE_FOLDERS=(\
    "src/plugins/C2Federates/Templates"\
    "src/plugins/DeploymentExporter/Templates"\
    "src/plugins/FederatesExporter/Templates"\
    "src/plugins/RunFederation/Templates"\
)

CURRENT_DIR=`pwd`
for template_folder in "${TEMPLATE_FOLDERS[@]}"
do
    cd $template_folder
    echo "Combining scripts in $(pwd)"
    node combine_templates.js
    echo "- - - - - - - - - - - - - - - - - - - - - - - - - -"
    cd $CURRENT_DIR
done

echo =======================================================
echo ${#TEMPLATE_FOLDERS[@]} sets of templates rebuilt.
echo =======================================================

sleep 2
