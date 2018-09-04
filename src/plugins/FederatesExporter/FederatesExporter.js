/*

Generated by PluginGenerator 0.14.0 from webgme
on Wed Dec 02 2015 15:05:52 GMT-0600 (CST).

Modified by T. Kramer 

Reformatted in C style, as far as possible.

The original version of this had 'C2Federates/Templates/Templates'
where there is now 'FederatesExporter/Templates/Templates'
The TEMPLATES were not being used. They are now being used.

The "define" construct is not part of standard JavaScript as described
by the 1078-page book "JavaScript The Definitive Guide", which does
not mention "define" anywhere. "define" is described in
https://github.com/amdjs/amdjs-api/wiki/AMD .

The "define" construct covers the whole file. A "define" can have an
id at the beginning, but no id is used in the cpswt "define"s.  The
other two parts of a define are (1) a list of paths to .js files
without the .js suffix and (2) a top level function whose arguments
match the list of files.  The return value of a "define" is the value
returned by the top level function of the define.

In this file, the functions defined in the "define" arguments are
executed by calls such as, for example, PubSubVisitors.call(this),
which in a sane language would be written as this.call(PubSubVisitors).

All of the .js files in the cpswt/cpswt-meta/src directory seem to be
"define" constructs.

The pubSubInteractions is a list of the paths to destinations (dst) of 
StaticInteractionPublish and sources (src) of StaticInteractionSubscribe.
The interactions whose paths are on the list are found using 
self.interactions[pubSubInteractions[i]]. Inversely, the path of an
interaction is its id.

*/

define
([
  'text!./metadata.json',
  'plugin/PluginBase',
  'common/util/ejs',             // added
  'C2Core/ModelTraverserMixin',
  'C2Core/xmljsonconverter',
  'C2Core/MavenPOM',
  'FederatesExporter/PubSubVisitors',
  'FederatesExporter/RTIVisitors',
  'FederatesExporter/Templates/Templates', // modified
  'C2Federates/GenericFederate',
  'C2Federates/JavaFederate',
  'C2Federates/MapperFederate',
  'C2Federates/CppFederate',
  'C2Federates/OmnetFederate',
  'C2Federates/CPNFederate'],
 function (pluginMetadata,
           PluginBase,
           ejs,                 // added
           ModelTraverserMixin,
           JSON2XMLConverter,
           MavenPOM,
           PubSubVisitors,
           RTIVisitors,
           TEMPLATES,           // modified
           GenericFederate,
           JavaFederate,
           MapperFederate,
           CppFederate,
           OmnetFederate,
           CPNFederate)
 {
    'use strict';
    var objectTraverserCheck;       // function variable
    var objectTraverserXml;         // function variable
    var interactionTraverserCheck;  // function variable
    var interactionTraverserXml;    // function variable
    var fomGenerator;               // function variable
    
    console.log("beginning of function in 'define' in FederatesExporter.js")

    pluginMetadata = JSON.parse(pluginMetadata);

    /*
    * Initializes a new instance of FederatesExporter.
    * @class
    * @augments {PluginBase}typ
    * @classdesc This class represents the plugin FederatesExporter.
    * @constructor
    */
    console.log("defining FederatesExporter function")
    var FederatesExporter = function()
    {
      this.federateTypes = this.federateTypes || {};
      this.pubSubInteractions = {};
      this.pubSubObjects = {};
      PluginBase.call(this);
      console.log("calling ModelTraverserMixin");
      ModelTraverserMixin.call(this);
      console.log("calling PubSubVisitors");
      PubSubVisitors.call(this);
      console.log("calling RTIVisitors");
      RTIVisitors.call(this);
      GenericFederate.call(this);
      JavaFederate.call(this);
      MapperFederate.call(this);
      CppFederate.call(this);
      OmnetFederate.call(this);
      CPNFederate.call(this);
      
      this.mainPom = new MavenPOM();
      this._jsonToXml = new JSON2XMLConverter.Json2xml();
      this.pluginMetadata = pluginMetadata;
    };
   
    // Prototypal inheritance from PluginBase.
    FederatesExporter.prototype = Object.create(PluginBase.prototype);
    FederatesExporter.prototype.constructor = FederatesExporter;
    FederatesExporter.metadata = pluginMetadata;
    
/***********************************************************************/

/* objectTraverserCheck

Returned Value: none

Called By:
  fomGenerator
  objectTraverserCheck (recursively)

This adds entries to pubSubObjects for all ancestors of objects that
already have entries.

By calling itself recursively, this goes through the object tree (from
top down) but builds the pubSubObjectss from bottom up. If an object
is on the pubSubObjects but its parent is not, an entry for the parent
of the object is added to the pubSubObjects; the entry represents that
the parent neither publishes or subscribes. If the parent publishes or
subscribes, an entry for the parent will have been made previously in
PubSubVisitors.

The final effect is that any object that is an ancestor of any object
originally put on the pubSubObjects in PubSubVisitors is also on
pubSubObjects.

*/
    console.log("defining objectTraverserCheck");
    objectTraverserCheck = function(fedEx, object)
    {
      console.log("executing objectTraverserCheck");
      object.children.forEach(function (child)
      {
	objectTraverserCheck(fedEx, child);
      });
      if (object.name != 'ObjectRoot')
	{
	  if ((object.id in fedEx.pubSubObjects) &&
	      !(object.basePath in fedEx.pubSubObjects))
	    {
	      fedEx.pubSubObjects[object.basePath] =
		{publish: 0,
		 subscribe: 0};
	    }
	}
    };
    
/***********************************************************************/

/* objectTraverserXml

Returned Value: a string of XML representing the object and its descendants

Called By:
  fomGenerator
  objectTraverserXml (recursively)

This builds the XML for objects.

The objectTraverserXml is a recursive function that takes an object
that may have children (also objects) and builds an objModel from
it. The objModel is given the same name and attributes as the object
and is given children that are XML code built by a recursive call to
itself on the children of the object.

Then XML for the objModel is generated (and saved) by calling
ejs.render using the fedfile_simobject_xml XML Template.

*/
    console.log("defining objectTraverserXml");
    objectTraverserXml = function(fedEx, object, space)
    {
      var objModel = {object: object,
		      indent: space,
		      attributes: object.attributes,
		      children: []};
      var pubSubData;
      console.log("executing objectTraverserXml");
      pubSubData = fedEx.pubSubObjects[object.id];
      if (pubSubData && pubSubData.publish)
	{
	  if (fedEx.pubSubObjects[object.id].subscribe)
	    {
	      object.sharing = "PublishSubscribe";
	    }
	  else
	    {
	      object.sharing = "Publish";
	    }
	}
      else if (pubSubData && pubSubData.subscribe)
	{
	  object.sharing = "Subscribe";
	}
      else
	{
	  object.sharing = "Neither";
	}
      // Some properties of the attributes of the objModel (which
      // are the attributes of the object) are modified in place
      // as follows.
      objModel.attributes.forEach(function(attr)
      {
	attr.sharing = object.sharing;
	if (attr.delivery === "reliable")
	  {
	    attr.delivery = "HLAreliable";
	  }
	else
	  {
	    attr.delivery = "HLAbestEffort";
	  }
	if (attr.order === "timestamp")
	  {
	    attr.order = "TimeStamp";
	  }
	else
	  { 
	    attr.order = "Receive";
	  }
      });
      
      // Here, objectTraverserXml calls itself recursively to
      // generate XML for the children before generating
      // XML for the parent.
      // We do not want to include the FederateObject.
      object.children.forEach(function(child)
      {
	if ((child.name != "FederateObject") &&
	    (child.id in fedEx.pubSubObjects))
	  {
	    objModel.children.push
	      (objectTraverserXml(fedEx, child, space + "    "));
	  }
      });
      // now generate XML for the parent if on pubSubObjects
      if (object.id in fedEx.pubSubObjects)
	{
	  // On the next line, a newline after 'return' causes
	  // an immediate return because of the automatic insertion
	  // of semicolons -- so don't put a newline there.
	  return ejs.render(TEMPLATES["fedfile_simobject_xml.ejs"],
			    objModel);
	}
    };
           
/***********************************************************************/

/* interactionTraverserCheck

Returned Value: none

Called By:
  fomGenerator
  interactionTraverserCheck (recursively)

This adds entries to pubSubInteractions for all ancestors of interactions
that already have entries.

By calling itself recursively, this goes through the interaction tree
(from top down) but builds the pubSubInteractions from bottom up. If
an interaction is on the pubSubInteractions but its parent is not, an
entry for the parent of the interaction is added to the
pubSubInteractions; the entry represents that the parent neither
publishes or subscribes. If the parent publishes or subscribes, an
entry for the parent will have been made previously in PubSubVisitors.

The final effect is that any interaction that is an ancestor of any
interaction originally put on the pubSubInteractions in PubSubVisitors
is also on pubSubInteractions.

*/
    console.log("defining interactionTraverserCheck");
    interactionTraverserCheck = function(fedEx, interaction)
    {
      console.log("executing interactionTraverserCheck");
      interaction.children.forEach(function (child)
      {
	interactionTraverserCheck(fedEx, child);
      });
      if (interaction.name != 'InteractionRoot')
	{
	  if ((interaction.id in fedEx.pubSubInteractions) &&
	      !(interaction.basePath in fedEx.pubSubInteractions))
	    {
	      fedEx.pubSubInteractions[interaction.basePath] =
		{publish: 0,
		 subscribe: 0};
	    }
	}
    };

/***********************************************************************/

/* interactionTraverserXml

Returned Value: a string of XML representing the interaction and its
                descendants

Called By:
  fomGenerator
  interactionTraverserXml (recursively)

This builds the XML for interactions.

*/
    console.log("defining interactionTraverserXml");
    interactionTraverserXml = function(fedEx, interaction, space)
    {
      var intModel = {interaction: interaction,
		      indent: space,
		      parameters: interaction.parameters,
		      children: []};
      var pubSubData;
      console.log("executing interactionTraverserXml");
      pubSubData = fedEx.pubSubInteractions[interaction.id];
      if (pubSubData && pubSubData.publish)
	{
	  if (fedEx.pubSubInteractions[interaction.id].subscribe)
	    {
	      interaction.sharing = "PublishSubscribe";
	    }
	  else
	    {
	      interaction.sharing = "Publish";
	    }
	}
      else if (pubSubData && pubSubData.subscribe)
	{
	  interaction.sharing = "Subscribe";
	}
      else
	{
	  interaction.sharing = "Neither";
	}
      if (interaction.delivery === "reliable")
	{
	  interaction.delivery = "HLAreliable";
	}
      else
	{
	  interaction.delivery = "HLAbestEffort";
	}
      if (interaction.order === "timestamp")
	{
	  interaction.order = "TimeStamp";
	}
      else
	{
	  interaction.order = "Receive";
	}
      // here interactionTraverserXml calls itself recursively to
      // generate XML for the children before generating
      // XML for the parent
      interaction.children.forEach(function (child)
      {
	if (child.id in fedEx.pubSubInteractions)
	  {
	    intModel.children.push
	      (interactionTraverserXml(fedEx, child, space + "    "));
	  }
      });
      
      // now generate XML for the parent if on pubSubInteractions
      if (interaction.id in fedEx.pubSubInteractions)
	{
	  // On the next line, a newline after 'return' causes
	  // an immediate return because of the automatic insertion
	  // of semicolons -- so don't put a newline there.
	  return ejs.render(TEMPLATES["fedfile_siminteraction_xml.ejs"],
			    intModel);
	}
    };
            
/***********************************************************************/

/* fomGenerator

Returned Value: none

Called By: anonymous function in FederatesExporter.prototype.main

This builds the fom model.

*/
    console.log("defining fomGenerator");
    fomGenerator = function(fedEx)
    {
      var today = new Date();
      var year = today.getFullYear();
      var month = today.getMonth();
      var day = today.getDate();
      
      console.log("executing fomGenerator");
      fedEx.fomModel = {federationname: fedEx.projectName,
			version: fedEx.getCurrentConfig().exportVersion.trim(),
			pocOrg: fedEx.mainPom.groupId,
			dateString: (year + "-" +
			             ((month < 10) ? "0" : "") + month + "-" +
			             ((day < 10) ? "0" : "") + day),
                        objectsXml: [],
			interactionsXml: []};
      
      // process interactionRoots, hence all interactions
      // normally is only one interactionRoot
      fedEx.interactionRoots.forEach(function (interactionRoot)
      {
	console.log("calling interactionTraverserCheck on interactionRoot");
	interactionTraverserCheck(fedEx, interactionRoot);
	console.log("calling interactionTraverserXml on interactionRoot");
	fedEx.fomModel.interactionsXml.push
	  (interactionTraverserXml(fedEx, interactionRoot, "    "));
      });
      
      // process objectRoots, hence all objects
      // normally is only one objectRoot
      fedEx.objectRoots.forEach(function(objectRoot)
      {
	console.log("calling objectTraverserCheck on objectRoot");
	objectTraverserCheck(fedEx, objectRoot);
	console.log("calling objectTraverserXml on objectRoot");
	fedEx.fomModel.objectsXml.push
	  (objectTraverserXml(fedEx, objectRoot, "    "));
      });
    };

/***********************************************************************/
    
/* FederatesExporter.prototype.main

Returned Value: none

Called By: ?

This is the main function for the plugin to execute. This will perform
the execution.

Notes:
  - Do NOT put any user interaction logic UI, etc. inside this method.
  - callback always has to be called even if error happened.

    @param {function(string, plugin.PluginResult)} callback -
    the result callback

*/
    
    console.log("defining FederatesExporter.prototype.main");
    FederatesExporter.prototype.main = function (callback)
    {
      // Use self to access core, project, result, etc from PluginBase.
      // These are all instantiated at this point.
      var self = this,
          generateFiles,           // function
          numberOfFilesToGenerate, // counter used in generateFiles function
          finishExport,            // function
          saveAndReturn;           // function
      
      console.log("executing FederatesExporter.prototype.main");
      self.fileGenerators = [];
      self.corefileGenerators = [];
      self.fom_sheets = {};
      self.interactions = {};
      self.interactionRoots = [];
      self.objects      = {};
      self.objectRoots = [];
      self.attributes   = {};
      self.federates = {};
      self.javafederateName = {};
      self.fedFilterMap = {};
      self.fedFilterMap["MAPPER_FEDERATES"] = "MAPPER";
      self.fedFilterMap["NON-MAPPER_FEDERATES"] = "NON_MAPPER";
      self.fedFilterMap["BOTH"] = "ORIGIN_FILTER_DISABLED";
      self.fedFilterMap["SELF"] = "SELF";
      self.fedFilterMap["NON-SELF"] = "NON_SELF";
      
      self.projectName = self.core.getAttribute(self.rootNode, 'name');
      self.project_version =
      self.getCurrentConfig().exportVersion.trim() +
      (self.getCurrentConfig().isRelease ? "" : "-SNAPSHOT");
      self.cpswt_version = self.getCurrentConfig().cpswtVersion.trim();
      self.directoryNameTemplate=
      '<%=federation_name%><%=artifact_name?"-"+artifact_name:""%><%=language?"-"+language:""%>';
      self.generateExportPackages =
        self.getCurrentConfig().generateExportPackages;
      self.mainPom.artifactId = self.projectName + "-root";
      self.mainPom.version = self.project_version;
      self.mainPom.packaging = "pom";
      self.mainPom.groupId = self.getCurrentConfig().groupId.trim();
      self.mainPom.addRepository(
        {
           'id': 'archiva.internal',
           'name': 'Internal Release Repository',
           'url': self.getCurrentConfig().repositoryUrlRelease.trim()
        });
        
      self.mainPom.addSnapshotRepository(
        {
	   'id': 'archiva.snapshots',
	   'name': 'Internal Snapshot Repository',
           'url': self.getCurrentConfig().repositoryUrlSnapshot.trim()
        });

      self.getCurrentConfig().includedFederateTypes.trim().split(" ").
        forEach(function(e)
          {
            if (self.federateTypes.hasOwnProperty(e))
              {
                self.federateTypes[e].includeInExport = true;
                if (self.federateTypes[e].hasOwnProperty('init'))
                  {
                    self.federateTypes[e].init.call(self); 
                  }
              }
          });
      
      //Add POM generator to file generators
      self.fileGenerators.push(function(artifact, callback)
      { // add POM file to artifact
        artifact.addFile('pom.xml',
                         self._jsonToXml.convertToString(self.mainPom.
                                                         toJSON()),
                         function (err)
                         {
                           if (err)
                             {
                               callback(err);
                               return;
                             }
                           else
                             {
                               callback();
                             }
                         });
      });

      // add fom generator to generators
      self.fileGenerators.push(function(artifact, callback)
      {
	fomGenerator(self); // build fom
        // add fom to artifact
        console.log("adding fom model to output, using ejs.render");
        artifact.addFile('fom/' + self.projectName + '.xml',
                         ejs.render(TEMPLATES['fedfile.xml.ejs'],
                                    self.fomModel),
                         function (err)
                         {
                           if (err)
                             {
                               callback(err);
                               return;
                             }
                           else
                             {
                               callback();
                             }
                         });
      });

      // end adding fom generator to generators

/***********************************************************************/

/* generateFiles

Returned Value: none

Called By:
  finishExport
  generateFiles (recursively)

This function is defined as a variable of FederatesExporter.prototype.main.
It uses the self variable.

*/      

      console.log("defining generateFiles");
      generateFiles = function(artifact, fileGenerators, doneBack)
      {
        if (numberOfFilesToGenerate > 0)
          { 
            fileGenerators[fileGenerators.length -
                           numberOfFilesToGenerate](artifact, function(err)
              {
                if (err)
                  {
                    callback(err, self.result);
                    return;
                  }
                numberOfFilesToGenerate--;
                if (numberOfFilesToGenerate > 0)
                  {
                    generateFiles(artifact, fileGenerators, doneBack);
                  }
                else
                  {
                    doneBack();
                  }
              });                
          }
        else
          {
            doneBack();
          }
      };
        
/***********************************************************************/

/* saveAndReturn

Returned Value: none

Called By: finishExport

This function is defined as a variable of FederatesExporter.prototype.main.
It uses the self variable.

*/      

      console.log("defining saveAndReturn");
      saveAndReturn = function(err)
      {
        var errorRaised = false;
        for (var i = 0; i < self.result.getMessages().length; i++)
          {
            var msg = self.result.getMessages()[i];
            if (msg.severity == 'error')
              {
                errorRaised = true;
              }
          }
        if (!errorRaised)
          {
            self.blobClient.saveAllArtifacts(function (err, hashes)
            {
              if (err)
                {
                  callback(err, self.result);
                  return;
                }
              
              // This will add a download hyperlink in the result-dialog.
              for (var idx = 0; idx < hashes.length; idx++)
                {
                  self.result.addArtifact(hashes[idx]);
                  
                  var artifactMsg =
                    'Code package ' +
                    self.blobClient.artifacts[idx].name +
                    ' was generated with id:[' + hashes[idx] + ']';
                  var buildURL =
                    "'http://c2w-cdi.isis.vanderbilt.edu:8080/job/c2w-pull/buildW ithParameters?GME_ARTIFACT_ID=" + hashes[idx] + "'";
                  artifactMsg += '<br><a title="Build package..." '+
                    'onclick="window.open(' + buildURL + ', \'Build System\'); return false;">Build artifact..</a>';
                  self.createMessage(null, artifactMsg );
                };
                    
              // This will save the changes. If you don't want to save;
              // exclude self.save and call callback directly from this
              // scope.
              self.save('FederatesExporter updated model.', function (err)
                {
                  if (err)
                    {
                      callback(err, self.result);
                      return;
                    }
                  self.result.setSuccess(true);
                  callback(null, self.result);
                  return;
                });
            });
          }
        else
          {
            self.result.setSuccess(false);
            callback(null, self.result);
            return;
          }
      };
       
/***********************************************************************/

/* finishExport

Returned Value: non

Called By: anonymous function used as an argument to 
  visitAllChildrenFromRootContainer

This function is defined as a variable of FederatesExporter.prototype.main.
It uses the self variable.

*/      

      console.log("defining finishExport");
      finishExport = function(err)
      {
        var artifact =
          self.blobClient.createArtifact(self.projectName.trim().
                                         replace(/\s+/g,'_') + '_generated');
        console.log("executing finishExport");
        if (self.generateExportPackages)
          {
            var coreArtifact =
              self.blobClient.createArtifact('generated_Core_Files');
          }
        numberOfFilesToGenerate = self.fileGenerators.length;
        if (numberOfFilesToGenerate > 0)
          {
            generateFiles(artifact, self.fileGenerators, function(err)
            {
              if (err)
                {
                  callback(err, self.result);
                  return;
                }
              numberOfFilesToGenerate = self.corefileGenerators.length;
              if (self.generateExportPackages &&
                  numberOfFilesToGenerate > 0)
                {
                  generateFiles(coreArtifact,
                                self.corefileGenerators, function(err)
                    {
                      if (err)
                        {
                          callback(err, self.result);
                          return;
                        }
                      saveAndReturn();
                      return;
                    });
                }
              else
                {
                  saveAndReturn();
                  return;
                } 
            });
          }
        else
          {
            self.result.setSuccess(true);
            callback(null, self.result);
          } 
      };
       
/***********************************************************************/

/*

This is a call to the visitAllChildrenFromRootContainer function (!) which
is defined in ModelTraverserMixin.js. The anonymous function is the second
argument.

*/
      
      console.log("calling visitAllChildrenFromRootContainer");
      self.visitAllChildrenFromRootContainer(self.rootNode, function(err)
        {
          if (err)
            {
              self.logger.error(err);
              self.createMessage(null, err, 'error');
              self.result.setSuccess(false);
              callback(null, self.result);
            }
          else
            {
              finishExport(err);
            }
        }); 
      
/***********************************************************************/

      self.postAllVisits(self);
      console.log("finished executing FederatesExporter.prototype.main");
    }; // end of ...prototype.main

/***********************************************************************/

    console.log("defining FederatesExporter.prototype.getChildSorterFunc");
    FederatesExporter.prototype.getChildSorterFunc = function(nodeType, self)
    {
      var self = this;
      var generalChildSorter = function(a, b)
      {
	//a is less than b by some ordering criterion : return -1;
	//a is greater than b by the ordering criterion: return 1;
	// a equal to b, than return 0;
	var aName = self.core.getAttribute(a,'name');
	var bName = self.core.getAttribute(b,'name');
	if (aName < bName) return -1;
	if (aName > bName) return 1;
	return 0;
      };
      return generalChildSorter;
    };
   
/***********************************************************************/

    console.log("defining FederatesExporter.prototype.excludeFromVisit");
    FederatesExporter.prototype.excludeFromVisit = function(node)
    {
      var self = this,
      exclude = false;
      
      if (self.rootNode != node)
        {    
          var nodeTypeName =
            self.core.getAttribute(self.getMetaType(node),'name');
          exclude = exclude 
            || self.isMetaTypeOf(node, self.META['Language [C2WT]'])
            || (self.federateTypes.hasOwnProperty(nodeTypeName) &&
                !self.federateTypes[nodeTypeName].includeInExport);
        }
      return exclude;
    };

/***********************************************************************/

/* getVisitorFuncName

This is defining the getVisitorFuncName function as a property of the
prototype of FederatesExporter. The getVisitorFuncName function is
also defined as a property of "this" in ModelTraverserMixin.js, but
the one that gets called when the FederatesExporter is executing is
this one.

*/
    
    console.log("defining FederatesExporter.prototype.getVisitorFuncName");
    FederatesExporter.prototype.getVisitorFuncName = function(nodeType)
    {
      var visitorName = 'generalVisitor';
      if (nodeType)
        {
          visitorName = 'visit_'+ nodeType;
          if (nodeType.endsWith('Federate'))
            {
              visitorName = 'visit_'+ 'Federate';
            }
        }
      return visitorName;   
    };

/***********************************************************************/

    console.log("defining FederatesExporter.prototype.getPostVisitorFuncName");
    FederatesExporter.prototype.getPostVisitorFuncName = function(nodeType)
    {
      var self = this,
      visitorName = 'generalPostVisitor';
      
      if (nodeType)
        {
          visitorName = 'post_visit_'+ nodeType;
          if (nodeType.endsWith('Federate'))
            {
              visitorName = 'post_visit_'+ 'Federate';
            }
        }
      return visitorName;
    };

/***********************************************************************/

    console.log("defining FederatesExporter.prototype.ROOT_visitor");
    FederatesExporter.prototype.ROOT_visitor = function(node)
    {
      var self = this;
      var root = {"@id": 'model:' + '/root',
                  "@type": "gme:root",
                  "model:name": self.projectName,
                  "gme:children": []};
      return {context:{parent: root}};
    };

/***********************************************************************/

    console.log("defining FederatesExporter.prototype.calculateParentPath");
    FederatesExporter.prototype.calculateParentPath = function(path)
    {
      if (!path)
        {
          return null;
        }
      var pathElements = path.split('/');
      pathElements.pop();
      return pathElements.join('/');
    };
    
/***********************************************************************/
    console.log("end of function in 'define' in FederatesExporter.js");
    return FederatesExporter;
 });
