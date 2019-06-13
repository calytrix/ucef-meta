/*
 JavaBaseFederate.js is used in the define of:
  JavaFederate.js
*/
define
  ( [
      'common/util/ejs',
      'C2Core/MavenPOM',
      'C2Federates/Templates/Templates',
      'C2Federates/JavaRTI'
    ],
    function( ejs,
      MavenPOM,
      TEMPLATES,
      JavaRTI )
    {

      'use strict';

      var JavaBaseFederateExporter;

      JavaBaseFederateExporter = function()
      {
        var self = this;
        var baseDirBasePath;
        var baseOutFilePath;
        var baseDirSpec;

        JavaRTI.call( this );
        this.federateTypes = this.federateTypes ||
        {};

        /***********************************************************************/

        this.federateTypes.JavaFederate = {
          includeInExport: false,
          longName: 'JavaBaseFederate',
          init: function()
          {
            var baseDirPath;
            var fullPath;
            var xmlCode;

            self.initJavaRTI();
            if ( self.javaFedInitDone )
            {
              return;
            }
            baseDirBasePath = self.projectName + '-java-federates/';
            baseDirSpec = {
              federation_name: self.projectName,
              artifact_name: "base",
              language: "java"
            };
            baseDirPath = baseDirBasePath + ejs.render( self.directoryNameTemplate, baseDirSpec );
            baseOutFilePath = baseDirPath + MavenPOM.mavenJavaPath;
            if ( !self.java_federateBasePOM )
            {
              self.java_federateBasePOM = new MavenPOM();
              self.java_federateBasePOM.groupId = 'org.cpswt';
              self.java_federateBasePOM.artifactId = 'federate-base';
              self.java_federateBasePOM.version = self.cpswt_version;
            }
            self.javaFedInitDone = true;
          }
        };

        /**
         * visit_JavaBaseFederate
         *
         * @param {Object} node a federate node
         * @param {Object} parent not used in this method
         * @param {Object} context the current context
         * @returns {Object} the updated context
         */
        this.visit_JavaBaseFederate = function( node, parent, context )
        {
          var self = this;

          self.logger.info( 'Visiting a JavaBaseFederate' );

          // Set up project POM files on visiting the first Java Federate

          if( !self.java_basePOM )
          {
            self.java_basePOM = new MavenPOM( self.javaPOM );
            self.java_basePOM.artifactId = ejs.render( self.directoryNameTemplate, baseDirSpec );
            self.java_basePOM.version = self.project_version;
            self.java_basePOM.packaging = "jar";
            self.java_basePOM.dependencies.push( self.java_rtiPOM );
            self.java_basePOM.dependencies.push( self.java_federateBasePOM );
          }

          var nameAttribute = self.core.getAttribute( node, 'name' );
          var timeConstrained = self.core.getAttribute( node, 'TimeConstrained' );
          var timeRegulating = self.core.getAttribute( node, 'TimeRegulating' );
          var lookahead = self.core.getAttribute( node, 'Lookahead' );
          var enableROAsynchronousDelivery = self.core.getAttribute( node, 'EnableROAsynchronousDelivery' );
          var corePath = self.core.getPath( node );

          context.javafedspec = self.createJavaFederateCodeModel();
          context.javafedspec.classname = nameAttribute;
          context.javafedspec.simname = self.projectName;
          context.javafedspec.timeconstrained = timeConstrained;
          context.javafedspec.timeregulating = timeRegulating;
          context.javafedspec.lookahead = lookahead;
          context.javafedspec.asynchronousdelivery = enableROAsynchronousDelivery;
          self.federates[ corePath ] = context.javafedspec;

          return {
            context: context
          };
        };

        /**
         * post_visit_JavaBaseFederate
         *
         * The name of this function is rather misleading. All is does is add
         * a file name property (outFileName) to context.javafedspec which
         * corresponds to the output folder and filename for the federate
         * "base" class Java source file.
         *
         * Note: baseDirBasePath has / at the end
         *
         * @param {Object} node a federate node
         * @param {Object} context  the current context
         * @returns {Object} the updated context
         */
        this.post_visit_JavaBaseFederate = function( node, context )
        {
          var self = this;
          var federateName = self.core.getAttribute( node, 'name' );
          // get the group ID and replace all '.' with '/' to create a path
          var groupPath = self.getCurrentConfig().groupId.trim().replace( /[.]/g, "/" );
          // generate the output file location and file name for the
          // "base" federate Java class
          var outFileName =
            baseDirBasePath +
            federateName +
            "/src/main/java/" +
            groupPath + "/" +
            federateName.toLowerCase() + "/" +
            "/base/" +
            "_" + federateName + ".java";
          context.javafedspec.outFileName = outFileName;
          return {
            context: context
          };
        };

        /***********************************************************************/

        this.createJavaFederateCodeModel = function()
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
            helpers:
            {},
            ejs: ejs,
            TEMPLATES: TEMPLATES
          };
        };

        /***********************************************************************/

        this.javaCodeModel = this.createJavaFederateCodeModel();
      };

      /***********************************************************************/

      return JavaBaseFederateExporter;
    } );
