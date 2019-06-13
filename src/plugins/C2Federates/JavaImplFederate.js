define
  ( [
      'common/util/ejs',
      'C2Core/MavenPOM',
      'C2Federates/Templates/Templates'
    ],
    function( ejs,
      MavenPOM,
      TEMPLATES )
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

        checkBack = function( err, callBack )
        {
          if ( err )
          {
            callBack( err );
            return;
          }
          else
          {
            callBack();
          }
        };

        this.federateTypes = this.federateTypes ||
        {};
        this.federateTypes.JavaImplFederate = {
          includeInExport: false,
          longName: 'JavaImplFederate',
          init: function()
          {
            var dirPath;
            if ( self.javaImplFedInitDone )
            {
              return;
            }
            dirPath = self.projectName + '-java-federates/';
            implDirSpec = {
              federation_name: self.projectName,
              artifact_name: "impl",
              language: "java"
            };
            implDirPath = dirPath;
            implOutFilePath = implDirPath + MavenPOM.mavenJavaPath;
            implOutResPath = implDirPath + MavenPOM.mavenResourcePath;
            self.projectName = self.core.getAttribute( self.rootNode, 'name' );
            self.javaImplFedInitDone = true;
          }
        };

        /**
         * visit_JavaImplFederate
         *
         * @param {Object} node a federate node
         * @param {Object} parent not used in this method
         * @param {Object} context the current context
         * @returns {Object} an object with a context property whose value is
         *          the context argument (which does not appear to be modified
         *          in this function).
         */
        this.visit_JavaImplFederate = function( node, parent, context )
        {
          var self = this;
          var nodeType = self.core.getAttribute( self.getMetaType( node ), 'name' );

          self.logger.info( 'Visiting a JavaImplFederate' );
          if ( !self.java_implPOM )
          {
            self.java_implPOM = new MavenPOM( self.javaPOM );
            self.java_implPOM.artifactId = ejs.render( self.directoryNameTemplate, implDirSpec );
            self.java_implPOM.version = self.project_version;
            self.java_implPOM.packaging = "jar";
          }

          var currentConfig = self.getCurrentConfig();
          var nameAttribute = self.core.getAttribute( node, 'name' );
          var timeConstrained = self.core.getAttribute( node, 'TimeConstrained' );
          var timeRegulating = self.core.getAttribute( node, 'TimeRegulating' );
          var lookahead = self.core.getAttribute( node, 'Lookahead' );
          var step = self.core.getAttribute( node, 'Step' );
          var enableROAsynchronousDelivery = self.core.getAttribute( node, 'EnableROAsynchronousDelivery' );
          var path = self.core.getPath( node );

          context.javaimplfedspec = self.createJavaImplFederateCodeModel();
          context.javaimplfedspec.groupId = currentConfig.groupId.trim();
          context.javaimplfedspec.artifactId = ejs.render( self.directoryNameTemplate, implDirSpec );
          context.javaimplfedspec.projectName = self.projectName;
          context.javaimplfedspec.projectVersion = self.project_version;
          context.javaimplfedspec.cpswtVersion = currentConfig.cpswtVersion;
          context.javaimplfedspec.snapshotUrl = currentConfig.repositoryUrlSnapshot;
          context.javaimplfedspec.releaseUrl = currentConfig.repositoryUrlRelease;
          context.javaimplfedspec.porticoPOM.artifactId = self.porticoPOM.artifactId;
          context.javaimplfedspec.porticoPOM.groupId = self.porticoPOM.groupId;
          context.javaimplfedspec.porticoPOM.version = self.porticoPOM.version;
          context.javaimplfedspec.porticoPOM.scope = self.porticoPOM.scope;
          context.javaimplfedspec.classname = nameAttribute;
          context.javaimplfedspec.simname = self.projectName;
          context.javaimplfedspec.configFile = nameAttribute + 'Config.json';
          context.javaimplfedspec.timeconstrained = timeConstrained;
          context.javaimplfedspec.timeregulating = timeRegulating;
          context.javaimplfedspec.lookahead = lookahead;
          context.javaimplfedspec.step = step;
          context.javaimplfedspec.asynchronousdelivery = enableROAsynchronousDelivery;
          context.javaimplfedspec.bindAddress = currentConfig.bindAddress.trim();
          self.javafederateName[ path ] = nameAttribute;
          self.federates[ path ] = context.javaimplfedspec;

          return {
            context: context
          };
        };

        /**
         * post_visit_JavaImplFederate
         *
         * Called By: post_visit_JavaFederate (in JavaFederate.js)
         *
         * Note: implDirPath has / at the end
         *
         * @param {Object} node a federate node
         * @param {Object} context the current context
         * @returns {Object} an object with a context property whose value is
         *          the context argument (which does not appear to be modified
         *          in this function).
         */
        this.post_visit_JavaImplFederate = function( node, context )
        {
          var self = this;

          // get the group ID and replace all '.' with '/' to create a path
          var groupPath = self.getCurrentConfig().groupId.trim().replace( /[.]/g, "/" );
          var className = self.core.getAttribute( node, 'name' );
          var fedPathDir = implDirPath + className;

          var outFileName = fedPathDir +
            "/src/main/java/" +
            groupPath + "/" +
            className.toLowerCase() +
            "/" + className + ".java";

          // set the SOM.xml output directory
          var feder = self.federateInfos[ self.core.getPath( node ) ];
          if ( feder )
          {
            feder.directory = fedPathDir + "/conf/";
          }

          var renderContext = context.javaimplfedspec;
          renderContext.allinteractiondata = [...renderContext.publishedinteractiondata,
                                              ...renderContext.subscribedinteractiondata];
          renderContext.allobjectdata = [...renderContext.publishedobjectdata,
                                         ...renderContext.subscribedobjectdata];

          /***********************************************************************/
          // Add impl POM from template
          self.fileGenerators.push( function( artifact, callback )
          {
            var template;
            var xmlCode;
            var fullPath;

            template = TEMPLATES[ 'java/federateimpl_uberpom.xml.ejs' ];
            xmlCode = ejs.render( template, renderContext );
            fullPath = fedPathDir + "/" + 'pom.xml';
            console.log( 'calling addFile for: ' + fullPath );
            artifact.addFile( fullPath, xmlCode,
              function( err )
              {
                checkBack( err, callback );
              } );
          } );

          /**
           * This creates "base" federate Java source files with names of the
           * form "_<federateName>.java"
           *
           * The file name (in context.javafedspec.outFileName) is constructed
           * in the post_visit_JavaBaseFederate function in JavaBaseFederate.js.
           */
          self.fileGenerators.push( function( artifact, callback )
          {
            var javaCode;
            var template;

            renderContext.moduleCollection.push( renderContext.classname );
            renderContext.publishedinteractiondata = context.javaimplfedspec.publishedinteractiondata;
            renderContext.publishedobjectdata = context.javaimplfedspec.publishedobjectdata;

            template = TEMPLATES[ 'java/federatebase.java.ejs' ];
            javaCode = ejs.render( template, renderContext );
            console.log( 'calling addFile for: ' + context.javafedspec.outFileName );
            artifact.addFile( context.javafedspec.outFileName, javaCode,
              function( err )
              {
                checkBack( err, callback );
              } );
          } );

          /**
           * This creates federate implementation Java source files with names of the
           * form "<federateName>.java"
           *
           * The file name (in context.javafedspec.outFileName) is constructed
           * in the post_visit_JavaBaseFederate function in JavaBaseFederate.js.
           */
          self.fileGenerators.push( function( artifact, callback )
          {
            var javaCode;
            var template;

            template = TEMPLATES[ 'java/federateimpl.java.ejs' ];
            javaCode = ejs.render( template, renderContext );
            console.log( 'calling addFile for: ' + outFileName );
            artifact.addFile( outFileName, javaCode,
              function( err )
              {
                checkBack( err, callback );
              } );
          } );

          /***********************************************************************/
          // Add federate RTi.rid file
          self.fileGenerators.push( function( artifact, callback )
          {
            var rtiCode;
            var fullPath;
            var template;

            fullPath = fedPathDir + '/RTI.rid';
            template = TEMPLATES[ 'java/rti.rid.ejs' ];
            rtiCode = ejs.render( template, renderContext );
            console.log( 'calling addFile for: ' + fullPath );
            artifact.addFile( fullPath, rtiCode,
              function( err )
              {
                checkBack( err, callback );
              } );
          } );

          /***********************************************************************/
          // Add federate config file
          self.fileGenerators.push( function( artifact, callback )
          {
            var jsonCode;
            var fullPath;
            var template;

            fullPath = fedPathDir + '/conf/' + renderContext.configFile;
            template = TEMPLATES[ 'java/federate-config.json.ejs' ];
            jsonCode = ejs.render( template, renderContext );
            console.log( 'calling addFile for: ' + fullPath );
            artifact.addFile( fullPath, jsonCode,
              function( err )
              {
                checkBack( err, callback );
              } );
          } );

          /***********************************************************************/
          // Add impl log config from template
          self.fileGenerators.push( function( artifact, callback )
          {
            var xmlCode;
            var fullPath;
            var template;

            fullPath = fedPathDir + '/conf/log4j2.xml';
            template = TEMPLATES[ 'java/log4j2.xml.ejs' ]
            xmlCode = ejs.render( template, self );
            console.log( 'calling addFile for: ' + fullPath );
            artifact.addFile( fullPath, xmlCode,
              function( err )
              {
                checkBack( err, callback );
              } );
          } );

          /***********************************************************************/

          return {
            context: context
          };
        }; // end of post_visit_JavaImplFederate function

        /***********************************************************************/

        this.createJavaImplFederateCodeModel = function()
        {
          return {
            simname: "",
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
            porticoPOM:
            {},
            helpers:
            {},
            ejs: ejs,
            moduleCollection: [],
            TEMPLATES: TEMPLATES
          };
        }

        /***********************************************************************/

        this.javaImplCodeModel = this.createJavaImplFederateCodeModel();
      } // end of JavaImplFederateExporter function

      /***********************************************************************/

      return JavaImplFederateExporter;
    } ); // end define
