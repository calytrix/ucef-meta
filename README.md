# UCEF Metamodel

A Web-based Graphical Modeling Environment (WebGME) metamodel for the Universal Cyber-Physical Systems Environment for Federation (UCEF).

WebGME (https://webgme.org/) is a collaborative environment for the design of domain specific modeling languages and the creation of domain models. This repository defines a WebGME metamodel for the design of High Level Architecture (HLA) federations, and includes a set of WebGME plugins that convert those models into executable Java code.

This repository is meant to be used in conjunction with the UCEF virtual machine available at https://github.com/usnistgov/ucef and cannot be compiled on its own.

...though, if you want to run it standalone the following may help:

## Running Standalone (Windows)

### Pre-requisites
 - install [MongoDB Community Server](https://www.mongodb.com/download-center/community) - use all the defaults during the installation process, and install
 MongoDB Compass when prompted
 - install [Node.js](https://nodejs.org/en/download/) - select the Latest LTS Version: (v10.16.0 at the time or writing) and use all the defaults during the installation process
 - install some bash shell compatible console, such as Cygwin, Conemu, or Cmder
 to make your life easier with command line stuff.

### Initialization of the WebGME Web Application
 - from the root folder of the project (i.e., the one containing this README), run `npm install`. This will download all the required dependencies for the WebGME
 applcation. Warnings during this process may be ignored.

### Starting WebGME
 - from the root folder of the project (i.e., the one containing this README), run `node app.js`
 - point a browser at http://localhost:8088/ (if this does not work, check the startup logging messages for the `Valid addresses of gme web server:` and use one of those)

### Restarting WebGME After Making Changes
For most purposes, after you make changes you probably want to…
 1. stop WebGME (`CTRL+C` in the bash shell running the WebGME web application)
 2. rebuild the templates (use the `> build.sh` utility script for this)
 3. restart WebGME (`> node app.js`)
 4. refresh the WebGME browser page

For a TL;DR command to do all this in one hit, copy and paste this line
into your bash shell:

```bash
rm -f *.tmp && .\build.sh && sleep 5 && node app.js
```

Again, once complete, **be sure to ALSO refresh the WebGME browser page to collect the changes**, as this is easy to forget and (if *not* done) can lead to some troubled times when debugging issues.

This will...
- remove all the `*.tmp` that get created every time code is generated
- update any changed `*.ejs` templates so that the respective `Template.js`
files contain the updated content
- wait 5 seconds for the previous steps to complete
- start the WebGME web application

### Resetting WebGME Database

If you need to reset WebGME's database, you can use MongoDB Compass to delete
the `c2webgme` database, and restart WebGME. The default database content
should be reinstated.

> **NOTE:** If you do this, you will lose any and all changes made within the
WebGME web interface. Don't do this unless you are really sure that you are
OK with losing everything shown in there.
