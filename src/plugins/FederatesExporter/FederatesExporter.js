/*

*******************************************

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
  'C2Federates/CPNFederate',
  'C2Federates/GridLabDFederate',
  'C2Federates/LabVIEWFederate'],
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
           CPNFederate,
           GridLabDFederate,
           LabVIEWFederate)
 {
    'use strict';
    var addEndJoinResign;           // function variable
    var objectTraverserCheck;       // function variable
    var objectTraverserXml;         // function variable
    var interactionTraverserCheck;  // function variable
    var interactionTraverserXml;    // function variable
    var fomGenerator;               // function variable
    
    pluginMetadata = JSON.parse(pluginMetadata);

    /*
    * Initializes a new instance of FederatesExporter.
    * @class
    * @augments {PluginBase}typ
    * @classdesc This class represents the plugin FederatesExporter.
    * @constructor
    */
    var FederatesExporter = function()
    {
      this.federateTypes = this.federateTypes || {};
      this.federateInfos = {};
      this.endJoinResigns = {};
      PluginBase.call(this);
      ModelTraverserMixin.call(this);
      PubSubVisitors.call(this);
      RTIVisitors.call(this);
      GenericFederate.call(this);
      JavaFederate.call(this);
      MapperFederate.call(this);
      CppFederate.call(this);
      OmnetFederate.call(this);
      CPNFederate.call(this);
      GridLabDFederate.call(this);
      LabVIEWFederate.call(this);      

      this.mainPom = new MavenPOM();
      this._jsonToXml = new JSON2XMLConverter.Json2xml();
      this.pluginMetadata = pluginMetadata;
    };
   
    // Prototypal inheritance from PluginBase.
    FederatesExporter.prototype = Object.create(PluginBase.prototype);
    FederatesExporter.prototype.constructor = FederatesExporter;
    FederatesExporter.metadata = pluginMetadata;
    
/***********************************************************************/

/*  addEndJoinResign

Returned Value: none

Called By: fomGenerator

This adds an entry to the pubSubInteractions for any interaction named
SimEnd, FederateResignInteraction, or FederateJoinInteraction.

*/
    addEndJoinResign = function(
     name,               // (string) name of the interaction to add
     pubSubInteractions, // (object) interaction data to add to
     id)                 // (string) id of the interation to add
    {
      if (name == 'SimEnd')
	{
	  if (pubSubInteractions[id])
	    {
	      pubSubInteractions[id].subscribe = 1;
	    }
	  else
	    {
	      pubSubInteractions[id] = {publish: 0,
					subscribe: 1};
	    }
	}
      else if ((name == 'FederateResignInteraction') ||
	       (name == 'FederateJoinInteraction'))
	{
	  if (pubSubInteractions[id])
	    {
	      pubSubInteractions[id].publish = 1;
	    }
	  else
	    {
	      pubSubInteractions[id] = {publish: 1,
					subscribe: 0};
	    }
	}
    };

/***********************************************************************/

/* objectTraverserCheck (documentation not updated for federates yet)

Returned Value: none

Called By:
  anonyomous fom generator in FederatesExporter.prototype.main
  objectTraverserCheck (recursively)

This adds entries to pubSubObjects for all ancestors of objects that
already have entries.

By calling itself recursively, this goes through the object tree (from
top down) but builds the pubSubObjects from bottom up. If an object is
on the federate.pubSubObjects but its parent is not, an entry for the
parent of the object is added to the federate.pubSubObjects; the entry
represents that the parent neither publishes or subscribes. If the
parent publishes or subscribes, an entry for the parent will have been
made previously in PubSubVisitors.

The final effect is that any object that is an ancestor of any object
originally put on the federate.pubSubObjects in PubSubVisitors is also
on federate.pubSubObjects.

*/

    objectTraverserCheck = function(federate, object)
    {
      object.children.forEach(function(child)
      {
	objectTraverserCheck(federate, child);
      });
      if (object.name != 'ObjectRoot')
	{
	  if ((object.id in federate.pubSubObjects) &&
	      !(object.basePath in federate.pubSubObjects))
	    {
	      federate.pubSubObjects[object.basePath] =
		{publish: 0,
		 subscribe: 0};
	    }
	}
    };

/***********************************************************************/

/* objectTraverserXml (documentation not updated for federates yet)

Returned Value: a string of XML representing the object and its descendants

Called By:
  anonyomous fom generator in FederatesExporter.prototype.main
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
      
    objectTraverserXml = function(federate, object, space)
    {
      var objModel;
      var objPuBSub;

      objModel = {name: object.name,
		  sharingXml: 0,
                  indent: space,
		  attributes: object.attributes,
		  children: []};
      objPuBSub = federate.pubSubObjects[object.id];
      if (objPuBSub && objPuBSub.publish)
	{
	  if (objPuBSub.subscribe)
	    {
	      objModel.sharingXml = "PublishSubscribe";
	    }
	  else
	    {
	      objModel.sharingXml = "Publish";
	    }
	}
      else if (objPuBSub && objPuBSub.subscribe)
	{
	  objModel.sharingXml = "Subscribe";
	}
      else
	{
	  objModel.sharingXml = "Neither";
	}
      // The attributes in the objModel are the attributes of the object.
      // Properites of attributes not related to XML generation are not
      // modified, but properties of attributes related to XML generation
      // are assigned as follows.
      objModel.attributes.forEach(function(attr)
      {
	attr.deliveryXml = ((attr.delivery === "reliable") ? "HLAreliable" :
			    "HLAbestEffort");
	attr.orderXml = ((attr.order === "timestamp") ? "TimeStamp" :
			 "Receive");
      });
      
      // Here, objectTraverserXml calls itself recursively to
      // generate XML for the children before generating
      // XML for the parent.
      // We do not want to include the FederateObject.
      object.children.forEach(function(child)
      {
        if ((child.name != "FederateObject") &&
            (child.id in federate.pubSubObjects))
          {
            objModel.children.push
              (objectTraverserXml(federate, child, space + "    "));
          }
      });
      // now generate XML for the parent if on pubSubObjects
      if (object.id in federate.pubSubObjects)
        {
          return ejs.render(TEMPLATES["fedfile_simobject_xml.ejs"], objModel);
        }
    };
   

/***********************************************************************/

/* interactionTraverserCheck

Returned Value: none

Called By:
  anonyomous fom generator in FederatesExporter.prototype.main
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
    interactionTraverserCheck = function(federate, interaction)
    {
      interaction.children.forEach(function (child)
      {
        interactionTraverserCheck(federate, child);
      });
      if (interaction.name != 'InteractionRoot')
        {
          if ((interaction.id in federate.pubSubInteractions) &&
              !(interaction.basePath in federate.pubSubInteractions))
            {
              federate.pubSubInteractions[interaction.basePath] =
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
  anonyomous fom generator in FederatesExporter.prototype.main
  interactionTraverserXml (recursively)

This builds the XML for interactions.

*/
    interactionTraverserXml = function(federate, interaction, space)
    {
      var intModel = {name: interaction.name,
		      sharingXml: 0,
		      deliveryXml: 0,
		      orderXml: 0,
                      indent: space,
                      parameters: interaction.parameters,
                      children: []};
      var intPubSub;
      intPubSub = federate.pubSubInteractions[interaction.id];
      if (intPubSub && intPubSub.publish)
        {
          if (intPubSub.subscribe)
            {
              intModel.sharingXml = "PublishSubscribe";
            }
          else
            {
              intModel.sharingXml = "Publish";
            }
        }
      else if (intPubSub && intPubSub.subscribe)
        {
          intModel.sharingXml = "Subscribe";
        }
      else
        {
          intModel.sharingXml = "Neither";
        }
      if (interaction.delivery === "reliable")
        {
          intModel.deliveryXml = "HLAreliable";
        }
      else
        {
          interaction.deliveryXml = "HLAbestEffort";
        }
      if (interaction.order === "timestamp")
        {
          intModel.orderXml = "TimeStamp";
        }
      else
        {
          intModel.orderXml = "Receive";
        }
      // here interactionTraverserXml calls itself recursively to
      // generate XML for the children before generating
      // XML for the parent
      interaction.children.forEach(function (child)
      {
        if (child.id in federate.pubSubInteractions)
          {
            intModel.children.push
              (interactionTraverserXml(federate, child, space + "    "));
          }
      });
      
      // now generate XML for the parent if on pubSubInteractions
      if (interaction.id in federate.pubSubInteractions)
        {
          return ejs.render(TEMPLATES["fedfile_siminteraction_xml.ejs"],
                            intModel);
        }
    };
            
/***********************************************************************/

/* fomGenerator

Returned Value: none

Called By: finishExport

This builds a file generator that generates a separate fom file for each
federate in a project.

Where fedEx.objectRoots.forEach is called, objectTraverserXml will
return undefined if there is no XML for objects. In that case,
objectsXml will have length 1, but objectsXml[0] will be undefined.

The call to the callback function with no argument evidently triggers
printing all the files that have been put into the artifact. If callback
is called each time around the loop below, a zip file is generated each
time containing one more fom file than the preceding zip file. Hence
that call can be made only once. In addition, webGME complains if
callback is called more than once.

*/
    fomGenerator = function(fedEx)
    {
      var today = new Date();
      var year = today.getFullYear();
      var month = today.getMonth();
      var day = today.getDate();
      var dateString = (year + "-" + ((month < 10) ? "0" : "") + month +
			"-" + ((day < 10) ? "0" : "") + day);
      var fomModelXml;      // model from which to generate XML
      var federId;          // id of federate  
      var feder;            // data for federate in federateInfos
      var endJoinResignId;  // id of a 
      var endJoinResign;
      var remaining;
      
      remaining = 0;
      for (federId in fedEx.federateInfos)
	{
	  remaining++;
	}
      console.log("adding fom generator to file generators");
      fedEx.fileGenerators.push(function(artifact, callback)
      {
	for (federId in fedEx.federateInfos)
	  {
	    remaining--;
	    feder = fedEx.federateInfos[federId];
	    console.log("generating fom file for " + feder.name);

	    fomModelXml =
	      {federateName: feder.name,
	       projectName: fedEx.projectName,
	       version: fedEx.getCurrentConfig().exportVersion.trim(),
	       pocOrg: fedEx.mainPom.groupId,
	       dateString: dateString,
	       objectsXml: [],
	       interactionsXml: []};
	    fedEx.interactionRoots.forEach(function (interactionRoot)
            {
	      for (endJoinResignId in fedEx.endJoinResigns)
		{
		  endJoinResign = fedEx.endJoinResigns[endJoinResignId];
		  addEndJoinResign(endJoinResign.name,
				   feder.pubSubInteractions, endJoinResignId);
		}
	      interactionTraverserCheck(feder, interactionRoot);
	      fomModelXml.interactionsXml.push
		(interactionTraverserXml(feder, interactionRoot, "    "));
	    });
	    fedEx.objectRoots.forEach(function(objectRoot)
            {
	      objectTraverserCheck(feder, objectRoot);
	      fomModelXml.objectsXml.push
		(objectTraverserXml(feder, objectRoot, "    "));
	    });
	    // add fom XML to artifact
	    if (remaining)
	      {
		artifact.addFile('fom/' + feder.name + '.xml',
				 ejs.render(TEMPLATES['fedfile.xml.ejs'],
					    fomModelXml),
				 function (err)
				 {
				   if (err)
				     {
				       callback(err);
				       return;
				     }
				 });
	      }
	    else
	      {
		artifact.addFile('fom/' + feder.name + '.xml',
				 ejs.render(TEMPLATES['fedfile.xml.ejs'],
					    fomModelXml),
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
	      }
	  }
      });
    };
      
/***********************************************************************/
    
/* FederatesExporter.prototype.main

Returned Value: none

Called By: ?

This is the main function for the plugin to execute. This will perform
the execution.

Notes:
    Use self to access core, project, result, etc from PluginBase;
    these are all instantiated at this point.

    Do NOT put any user interaction logic UI, etc. inside this method.
    callback always has to be called even if error happened.

    @param {function(string, plugin.PluginResult)} callback -
    the result callback

*/
    console.log("defining FederatesExporter.prototype.main");
    FederatesExporter.prototype.main = function (callback)
    {
      var self = this;
      var feder;                   // for-in variable
      var generateFiles;           // function
      var numberOfFileGenerators; // counter used in generateFiles function
      var finishExport;            // function
      var saveAndReturn;           // function

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
      
/***********************************************************************/
      
      console.log("adding pom generator to file generators");
      //Add POM generator to file generators
      self.fileGenerators.push(function(artifact, callback)
      { // add POM file to artifact
	console.log("executing pom generator function in fileGenerators");
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

/***********************************************************************/

/* generateFiles

Returned Value: none

Called By:
  finishExport
  generateFiles (recursively)

This function is defined as a variable of FederatesExporter.prototype.main.
It uses the self variable.

*/      

      generateFiles = function(
       artifact,
       fileGenerators,
       doneBack)
      {
        if (numberOfFileGenerators > 0)
          { 
            fileGenerators[fileGenerators.length -
                           numberOfFileGenerators](artifact, function(err)
              {
                if (err)
                  {
                    callback(err, self.result);
                    return;
                  }
                numberOfFileGenerators--;
                if (numberOfFileGenerators > 0)
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

      finishExport = function(
       err) // an error string or
      {
        var artifact =
          self.blobClient.createArtifact(self.projectName.trim().
                                         replace(/\s+/g,'_') + '_generated');
	console.log("start executing finishExport");
	fomGenerator(self);
        if (self.generateExportPackages)
          {
            var coreArtifact =
              self.blobClient.createArtifact('generated_Core_Files');
          }
        numberOfFileGenerators = self.fileGenerators.length;
        if (numberOfFileGenerators > 0)
          {
            generateFiles(artifact, self.fileGenerators, function(err)
            {
              if (err)
                {
                  callback(err, self.result);
                  return;
                }
              numberOfFileGenerators = self.corefileGenerators.length;
              if (self.generateExportPackages &&
                  numberOfFileGenerators > 0)
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
	    console.log("done generating files in finishExport");
            self.result.setSuccess(true);
            callback(null, self.result);
          } 
	console.log("end executing finishExport");
      };
       
/***********************************************************************/

/*

This is a call to the visitAllChildrenFromRootContainer function (!) which
is defined in ModelTraverserMixin.js. The anonymous function is the second
argument.

*/
      
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
    }; // end of ...prototype.main

/***********************************************************************/

/* FederatesExporter.prototype.getChildSorterFunc

This defines the FederatesExporter.prototype.getChildSorterFunc function
that defines a function to be passed to a sorting routine. The function
to be passed to a sorting routine takes pointers to two attributes (a and b)
and implements the rules:
  If the name of a is less than the name of b, return -1.
  Otherwise, if the name of a is greater than the name of b, return 1.
  Otherwise, return 0.

This is a very strange function because it does not use either of its
arguments. It is not clear whether this function is used anywhere.

*/    
    FederatesExporter.prototype.getChildSorterFunc = function(
     nodeType, // argument not used
     self)     // argument not used (overridden by var also named self)
    {
      var self = this; // overrides self argument
      var generalChildSorter = function(a, b)
      {
        var aName = self.core.getAttribute(a,'name');
        var bName = self.core.getAttribute(b,'name');
        if (aName < bName) return -1;
        if (aName > bName) return 1;
        return 0;
      };
      return generalChildSorter;
    };
   
/***********************************************************************/

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

Returned Value: a visitor function name

Called By: atModelNode in ModelTraverserMixin.js

This is defining the getVisitorFuncName function as a property of the
prototype of FederatesExporter. The getVisitorFuncName function is
also defined as a property of "this" in ModelTraverserMixin.js, but
the one that gets called when the FederatesExporter is executing is
this one.

*/
    
    FederatesExporter.prototype.getVisitorFuncName = function(
     nodeType) // (string) the name of a type of node or null
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

    return FederatesExporter;
 });
