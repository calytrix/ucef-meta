//jshint ignore: start
/* Generated file based on ejs templates */
define([], function() {
    return {
    "dockerFileTemplate.ejs": "--- \r\nservices: \r\n  fedManager:\r\n    build: .\r\n    image: \"cpswt/c2wtcore_v002:160816\"\r\n    command: \"sh start.sh FedManager\"\r\n    extra_hosts:\r\n      - \"cpswtng_archiva:10.0.2.15\"\r\n    volumes:\r\n      - <%- inputPrefix %>/FedManager:/root/Projects/c2wt/input\r\n      - <%- outputPrefix %>/FedManager:/root/Projects/c2wt/logs\r\n<%\r\nfedInfos.map(function(fedInfo) {\r\n-%>\r\n  <%- fedInfo.type %>_<%- fedInfo.name %>:\r\n    build: .\r\n    image: \"<%- dockerInfoMap[fedInfo.type].name %>:<%- dockerInfoMap[fedInfo.type].tag %>\"\r\n    command: \"sh start.sh <%- fedInfo.type %>,<%- fedInfo.name %>\" \r\n    extra_hosts:\r\n      - \"cpswtng_archiva:10.0.2.15\"\r\n    volumes:\r\n      - <%- inputPrefix %>/<%- fedInfo.name %>:/root/Projects/c2wt/input\r\n      - <%- outputPrefix %>/<%- fedInfo.name %>:/root/Projects/c2wt/logs\r\n<%\r\n})\r\n-%>\r\nversion: \"2\"\r\n",
    "startScript.ejs": "#!/bin/bash\r\nif [ $1 = \"FedManager\" ]; then\r\n   echo \"Starting --> \" $1\r\n   #xvfb-run -a mvn exec:exec -P Fedmanager\r\n   #xvfb-run -a mvn exec:exec -P FedManager &> /root/Projects/c2wt/logs/log.txt\r\n   xvfb-run -a mvn package exec:exec -P FedManager 2>&1 | tee -a /root/Projects/c2wt/logs/log.txt\r\nelse\r\n  echo \"Starting -->\" $1\r\n  #mvn exec:exec -P $1 &> /root/Projects/c2wt/logs/log.txt\r\n  mvn package exec:exec -P $1  2>&1 | tee -a /root/Projects/c2wt/logs/log.txt\r\nfi\r\n"
}});