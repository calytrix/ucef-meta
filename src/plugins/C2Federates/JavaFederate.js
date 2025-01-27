define
([
  'common/util/ejs',
  'C2Core/MavenPOM',
  'C2Federates/Templates/Templates',
  'C2Federates/JavaBaseFederate',
  'C2Federates/JavaImplFederate'],
 function (ejs,
	   MavenPOM,
	   TEMPLATES,
	   JavaBaseFederate,
	   JavaImplFederate)
 {

    'use strict';
    var JavaFederateExporter;
    
/***********************************************************************/

/* JavaFederateExporter (function-valued variable of top-level function object)

*/
    
    JavaFederateExporter = function()
    {
      var finalContext;
      JavaBaseFederate.call(this);
      JavaImplFederate.call(this);
      finalContext = {};
       
/***********************************************************************/

      this.visit_JavaFederate = function(node, parent, context)
      {
	var self;
	var nodeType;
  
	self = this;
	nodeType = self.core.getAttribute(self.getMetaType(node), 'name');
	self.logger.info('Visiting the JavaFederates');
	if (!self.javaPOM)
	  {
	    self.javaPOM = new MavenPOM(self.mainPom);
	    self.javaPOM.artifactId = self.projectName + "-java-federates";
	    self.javaPOM.directory = self.projectName + "-java-federates";
	    self.javaPOM.version = self.project_version;
	    self.javaPOM.addMavenCompiler(self.getCurrentConfig().
					  mavenCompilerPluginJavaVersion);
	    self.javaPOM.packaging = "pom";
	    self.javaPOM.dependencies.push(self.porticoPOM);
	  }
	if (!self.porticoPOM)
	  {  
	    self.porticoPOM = new MavenPOM();
	    self.porticoPOM.artifactId = "portico";
	    self.porticoPOM.groupId = "org.porticoproject";
	    // Set the portico Release Version
	    self.porticoPOM.version =
	      self.getCurrentConfig().porticoReleaseNum;
	    self.porticoPOM.scope = "provided";
	  }

	this.visit_JavaBaseFederate(node, parent, context);
	return this.visit_JavaImplFederate(node, parent, context);
      };

/***********************************************************************/

      this.post_visit_JavaFederate = function(node, context)
      {
	this.post_visit_JavaBaseFederate(node, context);
	finalContext = this.post_visit_JavaImplFederate(node, context);
	return finalContext;
      };

/***********************************************************************/

    } // end of JavaFederateExporter function object
    
/***********************************************************************/

    return JavaFederateExporter;
 });
