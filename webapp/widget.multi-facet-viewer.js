/*jshint multistr:true */

this.recline = this.recline || {};
this.recline.View = this.recline.View || {};

(function($, my) {
  "use strict";

// ## MultiFacetViewer
//
// Widget for displaying facets 
//
// Usage:
//
//      var viewer = new MultiFacetViewer({
//        model: dataset
//      });
my.MultiFacetViewer = Backbone.View.extend({
  className: 'recline-facet-viewer', 
  template: ' \
    <div class="facets"> \
      {{#facets}} \
      <div class="facet-summary" data-facet="{{id}}"> \
        <h3> \
          {{id}} \
        </h3> \
        <ul class="facet-items"> \
        {{#terms}} \
          <li><input name="{{id}}-filter" class="js-facet-filter" type="checkbox" value="{{term}}" {{#selected}}checked{{/selected}}>{{term}} ({{count}})</li> \
        {{/terms}} \
        </ul> \
      </div> \
      {{/facets}} \
    </div> \
  ',

  events: {
    'click .js-facet-filter': 'onFacetFilter'
  },
  initialize: function(model) {
    _.bindAll(this, 'render');
    this.listenTo(this.model.facets, 'all', this.render);
    this.listenTo(this.model.fields, 'all', this.render);
    this.allTerms = {};
  },
  render: function() {
    var tmplData = {
      fields: this.model.fields.toJSON()
    };
    var self = this;
    tmplData.facets = _.map(this.model.facets.toJSON(), function(facet) {
      // for each term, check if exists in allTerms
      if (_.isUndefined(self.allTerms[facet.id])) {
	self.allTerms[facet.id] = new Array();
      }
      var facetTerms = self.allTerms[facet.id];
      // get any terms in allTerms but not this list
      _.each(facetTerms, function(term) {
	if (!_.find(facet.terms, function(ft) {
	  return ft.term == term;
	})) {
	  facet.terms.push({ "term" : term, "count" : 0 });
	}
      });
      var filterTerms = new Array();
      var filter = _.find(self.model.queryState.attributes.filters, function(f) {
	if (f.field == facet.id) {
	  filterTerms = f.terms;
	}
	return false;
      });
      _.each(facet.terms, function(termObj) {
	// add any terms in this facet but not in allTerms
	if (!_.contains(facetTerms, termObj.term)) {
	  facetTerms.push(termObj.term);
	}
	// set selected
	if (_.contains(filterTerms, termObj.term)) {
	  termObj.selected = "true";
	}
      });
      // sort alpha
      facet.terms = _.sortBy(facet.terms, "term");
      return facet;
    });
    var templated = Mustache.render(this.template, tmplData);
    this.$el.html(templated);
    // are there actually any facets to show?
    if (tmplData.facets.length > 0) {
      this.$el.show();
    } else {
      this.$el.hide();
    }
  },
  onHide: function(e) {
    e.preventDefault();
    this.$el.hide();
  },
  onFacetFilter: function(e) {
    e.preventDefault();
    var $target= $(e.target);
    var fieldId = $target.closest('.facet-summary').attr('data-facet');
    var name = $target.attr('name');
    var terms = new Array();
    $('input[name="'+name+'"]:checkbox:checked').each(function(i){
      terms[i] = $(this).val();
    });
    if (terms.length == 0) {
      // find filter
      var idx = -1;
      _.find(this.model.queryState.get('filters'), function(f) {
	idx++;
	return f.field == fieldId;
      });
      if (idx >= 0) {
	this.model.queryState.removeFilter(idx);
      }
    } else {
      this.model.queryState.replaceFilter({
	type: 'terms', 
	field: fieldId, 
	terms: terms
      });
      this.model.query();
    }
  }
});


})(jQuery, recline.View);

