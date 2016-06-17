import Debug from 'debug';
import _ from 'lodash';
import $ from 'jquery';
import Handlebars from 'handlebars/runtime';
import { format } from 'util';
import Backbone from 'backbone';

/* Enable debug log */
window.debug = Debug;
Debug.enable('*');

const debug = Debug('Woowahan:Application');
const INTERVAL = 1000/60;

var reducers = {};
var queue = [];
var actionObject = {};
var queuemonitor;

window._ = _;
window.$ = window.jQuery = $;
window.Handlebars = Handlebars;

/* Enable backbone.js devtools for chrome */
if (window.__backboneAgent) {
  window.__backboneAgent.handleBackbone(Backbone);
}

function Application(settings) {
  settings = settings || {};

  this.enableQueue();
  this.combineReducer(settings.reducers);

  //TODO: 리펙토링
  window.application = this;
}

var fn = Application.prototype;

_.extend(fn, Backbone.Events);

fn.numberOfAction = () => queue.length;
fn.numberOfWorkAction = () => Object.keys(actionObject).length;

fn.enableQueue = function() {
  queuemonitor = setInterval(_.bind(this.queuing, this), INTERVAL);
};

fn.disableQueue = function() {
  queuemonitor = clearInterval(queuemonitor);
};

fn.addAction = function(id) {
  actionObject[id] = Date.now();

  if (this.numberOfWorkAction() === 1) {
    this.trigger('start');
  }
};

fn.removeAction = function(id) {
  delete actionObject[id];

  if (this.numberOfWorkAction() === 0) {
    this.trigger('finish');
  }
};

fn.queuing = function() {
  this.disableQueue();

  if (queue.length > 0) {
    let item = queue.shift();
    let Reducer = reducers[item.action.type];

    if (!Reducer) {
      this.enableQueue();
      throw new Error('The unregistered reducer. Please check the type of action, if there is a written reducer use after registration.');
    }

    new (Function.prototype.bind.apply(Reducer, _.concat(Reducer, item.action.data, _.bind(item.subscriber, this))))();
  }

  this.enableQueue();
};

fn.bindReducer = function(reducer) {
  reducers[reducer.actionName] = reducer;
};

fn.combineReducer = function(reducers) {
  if (!reducers) return;

  reducers.forEach(reducer => {
    this.bindReducer(reducer);
  });
};

fn.dispatch = function(action, subscriber) {
  debug(format('dispatch action %s', action.type));
  queue.push({ action, subscriber });
};

export default Application;