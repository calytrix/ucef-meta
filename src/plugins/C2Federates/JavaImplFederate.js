define
([
  'common/util/ejs',
  'C2Core/MavenPOM',
  'C2Federates/Templates/Templates'],
 function(ejs,
          MavenPOM,
          TEMPLATES)
 {
    'use strict';
    var JavaImplFederateExporter;

/***********************************************************************/

    JavaImplFederateExporter = function()
    {
      var self;
      var implOutFilePath;
      var implOutResPath;
      var implDirSpec;
      var implDirPath;
      var checkBack;

      self = this;

      checkBack = function(err, callBack)
      {
        if (err)
          {
            callBack(err);
            return;
          }
        else
          {
            callBack();
          }
      };

      this.federateTypes = this.federateTypes || {};
      this.federateTypes.JavaImplFederate =
      {includeInExport: false,
       longName: 'JavaImplFederate',
       init: function()
             {
               var dirPath;
               if (self.javaImplFedInitDone)
                 {
                   return;
                 }
               dirPath = self.projectName + '-java-federates/';
               implDirSpec = {federation_name: self.projectName,
                              artifact_name: "impl",
                              language: "java"};
               implDirPath = dirPath;
               implOutFilePath = implDirPath + MavenPOM.mavenJavaPath;
               implOutResPath = implDirPath + MavenPOM.mavenResourcePath;
               self.projectName = self.core.getAttribute(self.rootNode, 'name');
               self.javaImplFedInitDone = true;
             }
      };

/***********************************************************************/

      this.visit_JavaImplFederate = function(node, parent, context)
      {
        var self;
        var nodeType;
         
        self = this;
        nodeType = self.core.getAttribute(self.getMetaType(node), 'name');
        self.logger.info('Visiting a JavaImplFederate');
        if (!self.java_implPOM)
          {
            self.java_implPOM = new MavenPOM(self.javaPOM);
            self.java_implPOM.artifactId =
               ejs.render(self.directoryNameTemplate, implDirSpec);
            self.java_implPOM.version = self.project_version;
            self.java_implPOM.packaging = "jar";
          }
        context.javaimplfedspec = self.createJavaImplFederateCodeModel();
        context.javaimplfedspec.groupId =
          self.getCurrentConfig().groupId.trim();
        context.javaimplfedspec.artifactId =
           ejs.render(self.directoryNameTemplate, implDirSpec);
        context.javaimplfedspec.projectName = self.projectName;
        context.javaimplfedspec.projectVersion = self.project_version;
        context.javaimplfedspec.cpswtVersion =
           self.getCurrentConfig().cpswtVersion;
        context.javaimplfedspec.snapshotUrl =
          self.getCurrentConfig().repositoryUrlSnapshot;
        context.javaimplfedspec.releaseUrl =
          self.getCurrentConfig().repositoryUrlRelease;
        context.javaimplfedspec.porticoPOM.artifactId =
           self.porticoPOM.artifactId;
        context.javaimplfedspec.porticoPOM.groupId =
           self.porticoPOM.groupId;
        context.javaimplfedspec.porticoPOM.version = self.porticoPOM.version;
        context.javaimplfedspec.porticoPOM.scope = self.porticoPOM.scope;
        context.javaimplfedspec.classname =
           self.core.getAttribute(node, 'name');
        context.javaimplfedspec.simname = self.projectName;
        context.javaimplfedspec.configFile =
           self.core.getAttribute(node, 'name') + 'Config.json';
        context.javaimplfedspec.timeconstrained =
           self.core.getAttribute(node, 'TimeConstrained');
        context.javaimplfedspec.timeregulating =
           self.core.getAttribute(node, 'TimeRegulating');
        context.javaimplfedspec.lookahead =
           self.core.getAttribute(node, 'Lookahead');
        context.javaimplfedspec.step = self.core.getAttribute(node, 'Step');
        context.javaimplfedspec.asynchronousdelivery =
           self.core.getAttribute(node, 'EnableROAsynchronousDelivery');
        context.javaimplfedspec.bindAddress =
           self.getCurrentConfig().bindAddress.trim();
        self.javafederateName[self.core.getPath(node)] =
           self.core.getAttribute(node, 'name');
         self.federates[self.core.getPath(node)] = context.javaimplfedspec;
         return {context: context};
       };

/***********************************************************************/

/* post_visit_JavaImplFederate

Returned Value: an object with a context property whose value is the
context argument (which does not appear to be modified in this function).

Called By: post_visit_JavaFederate (in JavaFederate.js)

Note: implDirPath has / at the end

*/
      this.post_visit_JavaImplFederate = function(node, context)
      {
        var self;
        var renderContext;
        var fedPathDir;
        var outFileName;
        var feder;
        var groupPath;
         
        self = this;
        groupPath = self.getCurrentConfig().groupId.trim().replace(/[.]/g, "/");
        renderContext = context.javaimplfedspec;
        fedPathDir = implDirPath + self.core.getAttribute(node, 'name');
        outFileName = fedPathDir + "/src/main/java/" + groupPath + "/" +
                      self.core.getAttribute(node, 'name').toLowerCase() +
                      "/" + self.core.getAttribute(node, 'name') + ".java";
        // set the SOM.xml output directory
        feder = self.federateInfos[self.core.getPath(node)];
        if (feder)
          {
            feder.directory = fedPathDir + "/conf/";
          }
        renderContext.allobjectdata = renderContext.publishedobjectdata.
                                  concat(renderContext.subscribedobjectdata);
        renderContext.allinteractiondata =
            renderContext.publishedinteractiondata.
               concat(renderContext.subscribedinteractiondata);

/***********************************************************************/

        //Add impl POM from template
        self.fileGenerators.push(function(artifact, callback)
        {
          var xmlCode;
          var fullPath;
          var template;

          template = TEMPLATES['java/federateimpl_uberpom.xml.ejs'];
          xmlCode = ejs.render(template, renderContext);
          fullPath = fedPathDir + "/" + 'pom.xml';
          console.log('calling addFile for: ' + fullPath);
          artifact.addFile(fullPath, xmlCode,
                           function(err) {checkBack(err, callback);});
        });

/***********************************************************************/

/*

This prints files with names of the form <federateName>Base.java

The file name (in context.javafedspec.outFileName) is constructed
in the post_visit_JavaBaseFederate function in JavaBaseFederate.js.

*/
        self.fileGenerators.push(function(artifact, callback)
        {
          var javaCode;
          var template;
  
          renderContext.moduleCollection.push(renderContext.classname);
          renderContext.publishedinteractiondata =
            context.javaimplfedspec.publishedinteractiondata;
          renderContext.publishedobjectdata =
            context.javaimplfedspec.publishedobjectdata;
          template = TEMPLATES['java/federatebase.java.ejs'];
          javaCode = ejs.render(template, renderContext);
          console.log('calling addFile for: ' +
                      context.javafedspec.outFileName);
          artifact.addFile(context.javafedspec.outFileName, javaCode,
                           function(err) {checkBack(err, callback);});
        });

/***********************************************************************/

        self.fileGenerators.push(function(artifact, callback)
        {
          var javaCode;
          var template;

          template = TEMPLATES['java/federateimpl.java.ejs'];
          javaCode = ejs.render(template, renderContext);
          console.log('calling addFile for: ' + outFileName);
          artifact.addFile(outFileName, javaCode,
                           function(err) {checkBack(err, callback);});
        });

/***********************************************************************/

        //Add federate RTi.rid file
        self.fileGenerators.push(function(artifact, callback)
        {
          var rtiCode;
          var fullPath;
          var template;

          fullPath = fedPathDir + '/RTI.rid';
          template = TEMPLATES['java/rti.rid.ejs'];
          rtiCode = ejs.render(template, renderContext);
          console.log('calling addFile for: ' + fullPath);
          artifact.addFile(fullPath, rtiCode,
                           function(err) {checkBack(err, callback);});
        });

/***********************************************************************/

        //Add federate config file
        self.fileGenerators.push(function(artifact, callback)
        {
          var jsonCode;
          var fullPath;
          var template;

          fullPath = fedPathDir + '/conf/' + renderContext.configFile;
          template = TEMPLATES['java/federate-config.json.ejs'];
          jsonCode = ejs.render(template, renderContext);
          console.log('calling addFile for: ' + fullPath);
          artifact.addFile(fullPath, jsonCode,
                           function(err) {checkBack(err, callback);});
        });

/***********************************************************************/

        //Add impl log config from template
        self.fileGenerators.push(function(artifact, callback)
        {
          var xmlCode;
          var fullPath;
          var template;

          fullPath = fedPathDir + '/conf/log4j2.xml';
          template = TEMPLATES['java/log4j2.xml.ejs']
          xmlCode = ejs.render(template, self);
          console.log('calling addFile for: ' + fullPath);
          artifact.addFile(fullPath, xmlCode,
                           function(err) {checkBack(err, callback);});
        });

/***********************************************************************/

        return {context: context};
      }; // end of post_visit_JavaImplFederate function

/***********************************************************************/

      this.createJavaImplFederateCodeModel = function()
      {
        return {simname: "",
                melderpackagename: null,
                classname: "",
                isnonmapperfed: true,
                timeconstrained: false,
                timeregulating: false,
                lookahead: null,
                asynchronousdelivery: false,
                publishedinteractiondata: [],
                subscribedinteractiondata: [],
                allinteractiondata: [],
                publishedobjectdata: [],
                subscribedobjectdata: [],
                allobjectdata: [],
                porticoPOM: {},
                helpers: {},
                ejs: ejs,
                moduleCollection: [],
                TEMPLATES: TEMPLATES};
      }

/***********************************************************************/

      this.javaImplCodeModel = this.createJavaImplFederateCodeModel();
    } // end of JavaImplFederateExporter function

/***********************************************************************/

    return JavaImplFederateExporter;
 }); // end define
