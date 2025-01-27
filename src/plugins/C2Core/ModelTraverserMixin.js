/*

This "define" appears to be intended to be used by any other "define"
that needs to go through all the nodes in a webgme model. It is used
by at least FederatesExporter.js and DeploymentExporter.js.

*/

define([], function()
  {
    'use strict';
    /**
     * Initializes a new instance of JSONLDExport.
     * @class
     * @augments {PluginBase}
     * @classdesc This class represents the plugin JSONLDExport.
     * @constructor
     */
    var withModelTraverser = function()
    {
        
/***********************************************************************/

      this.getVisitorFuncName = this.getVisitorFuncName ||
      function(nodeType)
      {
        var self = this,
        visitorName = 'generalVisitor';
        if (nodeType)
          {
            visitorName = 'visit_'+ nodeType;
          }
        return visitorName;
      }
      
/***********************************************************************/

      this.getPostVisitorFuncName = this.getPostVisitorFuncName ||
      function(nodeType)
      {
        var self = this,
        visitorName = 'generalPostVisitor';
        if (nodeType)
          {
            visitorName = 'post_visit_'+ nodeType;
          }
        return visitorName;
      }
        
/***********************************************************************/

/* this.getChildSorterFunc

*/

        this.getChildSorterFunc = this.getChildSorterFunc ||
        function(nodeType, self)
          {
            var self = this,
                visitorName = 'generalChildSorter';

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
          }

/***********************************************************************/

/* this.excludeFromVisit

Returned Value: none

Called By: visitAllChildrenRec
  
If this.excludeFromVisit is not already defined, it is defined to
return false.

This function is defined also in FederatesExporter.js and
DeploymentExporter.js (and possibly elsewhere)

*/

        this.excludeFromVisit = this.excludeFromVisit ||
        function(node)
          {
            var exclude = false;
            return exclude;
          }

/***********************************************************************/

/* this.visitAllChildrenFromRootContainer

Returned Value: none

Called By:
  FederatesExporter.prototype.main in FederatesExporter.js
  DeploymentExporter.Prototype.main in DeploymentExporter.js
  and maybe other functions

*/

        this.visitAllChildrenFromRootContainer = function(rootNode, callback)
          {
            var self = this,
                error = '',
                context = {},
                counter,
                counterCallback;

            counter = {visits: 1};
            counterCallback = function(err)
              {
                error = err ? error + err : error;
                counter.visits -= 1;
                if (counter.visits === 0)
                  {
                    try
                      {
                        var ret = self['ROOT_post_visitor'](rootNode, context);
                      }
                    catch(err)
                      {

                      }
                    callback(error === '' ? undefined : error);
                    return;
                  }
                if (err)
                  {
                    callback(error);
                    return;
                  }
              };
            try
              {
                var ret = self['ROOT_visitor'](rootNode, context);
                if (ret['error'])
                  {
                    callback(error === '' ? undefined : error);
                    return;
                  }
                else
                  {
                    context = ret['context'];
                  }
              }
            catch(err)
              {

              }

            self.visitAllChildrenRec(rootNode, context, counter,
                                     counterCallback);
          };
        
/***********************************************************************/

/* this.visitAllChildrenRec

Returned Value: none

Called By:
  visitAllChildrenFromRootContainer
  visitAllChildrenRec (recursively)

*/

        this.visitAllChildrenRec = function(node, context, counter, callback)
          {
            var self = this;
            if (self.excludeFromVisit(node))
              {
                callback(null, context);
                return;
              }

            self.core.loadChildren(node, function(err, children)
              {
                var i,
                    atModelNodeCallback,
                    doneModelNodeCallback,
                    doneVisitChildCallback,
                    nodeType,
                    sorterFunc,
                    childsToVisit = children.length;
                if (err)
                  {
                    callback('loadChildren failed for ' +
                             self.core.getAttribute(node, 'name'));
                    return;
                  }
                counter.visits -= 1;
                doneModelNodeCallback = function(err, ctx)
                  {
                    if (err)
                      {
                        callback(err);
                      }
                    else
                      {
                        callback(null);
                      }
                    return
                  };

                if (childsToVisit === 0)
                  {
                    if (node !== self.rootNode)
                      {
                        self.doneModelNode(node,context,doneModelNodeCallback);
                      }
                    else
                      {
                        doneModelNodeCallback(null);
                      }
                    return;
                  }
                counter.visits += children.length;
                if (node !== self.rootNode)
                  {
                    nodeType = self.core.getAttribute(self.getMetaType(node),
                                                      'name');
                  }
                sorterFunc = self.getChildSorterFunc(nodeType, self);
                if (sorterFunc)
                  {
                    children.sort(sorterFunc);
                  }
                doneVisitChildCallback = function(err)
                  {
                    if (err)
                      {
                        callback(err);
                        return; 
                      }

                    childsToVisit -= 1;
                    if (childsToVisit === 0)
                      {
                        if (node !== self.rootNode)
                          {
                            self.doneModelNode(node, context,
                                               doneModelNodeCallback);
                          }
                        else
                          {
                            doneModelNodeCallback(null);
                          }
                        return;
                      } 
                  }

                atModelNodeCallback = function(childNode)
                  {
                    return function(err, ctx)
                      {
                        if (err)
                          {
                            callback(err);
                            return;
                          }
                        self.visitAllChildrenRec(childNode, ctx, counter,
                                                 doneVisitChildCallback);
                      };
                  };
                for (i = 0; i < children.length; i += 1)
                  {
                    self.atModelNode(children[i], node,
                                     self.cloneCtx(context),
                                     atModelNodeCallback(children[i]));
                  }
              }); // closes function, args, and call to self.core.loadChildren 
          }; // closes function and this.visitAllChildrenRec =

/***********************************************************************/

/* this.atModelNode

Returned Value: none

Called By: visitAllChildrenRec

The following line of the atModeNode function is strange

ret = self[self.getVisitorFuncName(nodeType)](node, parent, context);

because one would expect it to be divided into two parts as follows

  funcName = self.getVisitorFuncName(nodeType);
  ret = self[funcName](node, parent, context);

However, if that is done, the FederatesExporter gives error messages.

It appears that the long line is used because self[funcName] is often
undefined, causing an error. Thus, if the line is split into two
parts, a try and catch would be required for both parts. It might be
better to split it anyway.

Also, it seems kludgy to execute a statement that is known to be in error
much of the time and recover by catching the error. If possible, it would
seem better to test for a known name and call the appropriate function.

*/

        this.atModelNode = function(node, parent, context, callback)
          {
            var self = this,
                nodeType = self.core.getAttribute(self.getMetaType(node),
                                                  'name'),
                nodeName = self.core.getAttribute(node, 'name'),
                id,
                ret = null;
            if (self.federateInfos && (nodeType in self.federateTypes))
              {
                id = self.core.getPath(node);
                if (self.federateInfos[id])
                  {
                    self.federateInfos[id].name = nodeName;
                  }
                else
                  {
                    self.federateInfos[id] = {name: nodeName,
                                              directory: null,
                                              pubSubObjects: {},
                                              pubSubInteractions: {}};
                  }
              }
            try
              {
                ret = self[self.getVisitorFuncName(nodeType)](node, parent,
                                                              context);
                if (ret['error'])
                  {
                    callback((ret['error'] === '') ? undefined : ret['error']);
                    return;
                  }
                else
                  {
                    callback(null, ret['context']);
                    return;
                  }

              }
            catch(err)
              {
                if (err.message ==
                    'self[self.getVisitorFuncName(...)] is not a function')
                  {
                  }
                else
                  {
                    callback(err);
                    return;
                  }
              }
            callback(null, context);
            return;
          };

/***********************************************************************/

/* this.doneModelNode

Returned Value: none

Called By: ?

*/
        this.doneModelNode = function(node, context, callback)
          {
            var self = this,
                nodeType = self.core.getAttribute(self.getMetaType(node),
                                                  'name'),
                nodeName = self.core.getAttribute(node, 'name'),
                ret = null;

            try
              {
                ret = self[self.getPostVisitorFuncName(nodeType)](node,
                                                                  context);
                if (ret['error'])
                  {
                    callback(ret['error'] === '' ? undefined : ret['error']);
                    return;
                  }
                else
                  {
                    callback(null, ret['context']);
                    return;
                  }
              }
            catch(err)
              {
                if (err.message ==
                    'self[self.getPostVisitorFuncName(...)] is not a function')
                  {

                  }
                else
                  {
                    callback(err);
                  }
              }
            callback(null, context);
            return;
          };

/***********************************************************************/

/* this.cloneCtx

Returned Value: a copy of an object

Called By: ?

*/
        this.cloneCtx = function(obj)
          {
            var copy;
            if (null == obj || "object" != typeof obj)
              return obj;
            copy = obj.constructor();
            for (var attr in obj)
              {
                if (obj.hasOwnProperty(attr))
                  copy[attr] = obj[attr];
              }
            return copy;
          }

/***********************************************************************/

      };
    return withModelTraverser;
  }); // closes function and define
