//jshint ignore: start
/* Generated file based on ejs templates */
define([], function() {
    return {
    "dockerFileTemplate.ejs": "--- \r\nservices: \r\n  fedManager:\r\n    build: .\r\n    tty: true\r\n    image: \"cpswt/c2wtcore_v002:170626\"\r\n    command: \"sh start.sh FedManager\"\r\n    sysctls:\r\n      - net.ipv6.conf.all.disable_ipv6=1\r\n    extra_hosts:\r\n      - \"cpswtng_archiva:<%- cpswtng_archiva_ip %>\"\r\n    volumes:\r\n      - <%- inputPrefix %>/FedManager:/root/Projects/c2wt/input\r\n      - <%- outputPrefix %>/FedManager:/root/Projects/c2wt/logs\r\n<%\r\nfedInfos.map(function(fedInfo) {\r\n-%>\r\n  <%- fedInfo.type %>_<%- fedInfo.name %>:\r\n    build: .\r\n    image: \"<%- dockerInfoMap[fedInfo.type].name %>:<%- dockerInfoMap[fedInfo.type].tag %>\"\r\n    command: \"sh start.sh <%- fedInfo.name %>,<%- fedInfo.type %>\" \r\n    sysctls:\r\n      - net.ipv6.conf.all.disable_ipv6=1\r\n    extra_hosts:\r\n      - \"cpswtng_archiva:<%- cpswtng_archiva_ip %>\"\r\n    links:\r\n      - fedManager  \r\n    volumes:\r\n      - <%- inputPrefix %>/<%- fedInfo.name %>:/root/Projects/c2wt/input\r\n      - <%- outputPrefix %>/<%- fedInfo.name %>:/root/Projects/c2wt/logs\r\n<%\r\n})\r\n-%>\r\nversion: \"2.1\"\r\n",
    "startScript.ejs": "#!/bin/bash\r\n\r\n\r\nfedmgrIP=\"http://fedManager\"\r\n# fedmgrIP=$2\r\nfedmgrIPport=\"8083\"\r\nfedmgr=\"/fedmgr\"\r\n\r\n\r\nurl=${fedmgrIP}\":\"${fedmgrIPport}${fedmgr}\r\n\r\n# start fedmgr\r\nstart_fedmgr(){\r\n   mvn exec:java -U -X -P FederationManagerExecJava 2>&1 | tee -a /root/Projects/c2wt/logs/log.txt\r\n}\r\n\r\n# check if fedmgrRest is up\r\n\r\nwaitforfedmgrRESTup(){\r\n    query=\"curl -sL -w \"%{http_code}\\\\n\" \"${url}\" -o /dev/null\"\r\n    #  echo $query\r\n    result=`$query`\r\n    echo $result\r\n    while [ $result -ne 200 ] ; do\r\n        echo \"Sleep\"\r\n        sleep 1\r\n        result=`$query`\r\n    done\r\n    echo \"fedmgr started\"\r\n    \r\n}\r\n# issue start\r\ninitializefedmgr(){\r\n  echo \"==========================\\n\"\r\n  echo \"Sending START POST REQUEST\"\r\n  curl -i -X POST ${url} --data '{\"action\": \"START\"}' -H \"Content-Type: application/json\"\r\n  sleep 2\r\n  echo \"FedManager Initialized!!\\n\"\r\n  echo \"=========================\\n\"\r\n}\r\n\r\n\r\n\r\necho $url\r\n\r\nif [ $1 = \"FedManager\" ]; then\r\n   echo \"Starting --> \" $1\r\n   #xvfb-run -a mvn exec:exec -P Fedmanager\r\n   #xvfb-run -a mvn exec:exec -P FedManager &> /root/Projects/c2wt/logs/log.txt\r\n   #xvfb-run -a mvn package exec:exec -P FedManager 2>&1 | tee -a /root/Projects/c2wt/logs/log.txt\r\n   #mvn exec:java -U -X -P FederationManagerExecJava 2>&1 | tee -a /root/Projects/c2wt/logs/log.txt\r\n   start_fedmgr\r\nelse\r\n  echo \"Starting -->\" $1\r\n  #mvn exec:exec -P $1 &> /root/Projects/c2wt/logs/log.txt\r\n  #mvn package exec:exec -P $1  2>&1 | tee -a /root/Projects/c2wt/logs/log.txt\r\n  waitforfedmgrRESTup\r\n  initializefedmgr\r\n  if echo $1 | grep \"ExecJava\"\r\n  then\r\n      mvn exec:java -P $1  2>&1 | tee -a /root/Projects/c2wt/logs/log.txt\r\n  else\r\n      mvn package exec:exec -P $1  2>&1 | tee -a /root/Projects/c2wt/logs/log.txt\r\n  fi\r\nfi\r\n"
}});