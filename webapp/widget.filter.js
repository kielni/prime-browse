/*jshint multistr:true */

this.recline = this.recline || {};
this.recline.View = this.recline.View || {};

(function($, my) {
  "use strict";

// ## FilterViewer
//
// Widget for displaying filters
//
// Usage:
//
//      var viewer = new FilterViewer({
//        model: dataset
//      });
my.FilterViewer = Backbone.View.extend({
  className: 'recline-filter-viewer', 
  template: ' \
    <div class="filters"> \
      {{#filters}} \
      <div class="range-filter"> \
        <label for="filter-{{field}}">{{label}}</label> \
        <span id="filter-{{field}}" class="range-label"></span> \
      </div> \
      <div id="slider-{{field}}" data-value="{{field}}"></div> \
      {{/filters}} \
    </div> \
  ',

  initialize: function(model) {
    _.bindAll(this, 'render');
    this.listenTo(this.model.facets, 'all', this.render);
    // filter widgets for year, Metascore, and imdbRating
    this.fields = [ 
      { 'field' : 'year', 'min' : 1900, 'max' : 2014, 'label': 'Year: ' },
      { 'field' : 'Metascore', 'min' : 0, 'max' : 10, 'label': 'Metascore' },
      { 'field' : 'imdbRating', 'min' : 0, 'max' : 10, 'label' : 'IMDB Rating' },
      { 'field' : 'Runtime', 'min' : 30, 'max' : 180, 'label' : 'Run time (min)' }
    ];
  },
  render: function() {
    var tmplData = {
      filters: this.fields
    };
    var self = this;
    var templated = Mustache.render(this.template, tmplData);
    this.$el.html(templated);
    var filters = this.model.queryState.attributes.filters;
    _.each(this.fields, function(field) {
      var filter = _.find(filters, function(f) {
	return (f.field == field.field);
      });
      var filterMin, filterMax;
      if (_.isUndefined(filter)) {
	filterMin = field.min;
	filterMax = field.max;
      } else {
	filterMin = filter.from;
	filterMax = filter.to;
      }
      $('#slider-'+field.field).slider({
	range: true,
	min: field.min,
	max: field.max,
	values: [ filterMin, filterMax ],
	change: function(e, ui) {
	  var $target = $(e.target);
	  var fieldId = $target.attr('data-value');
	  var min = ui.values[0];
	  var max = ui.values[1];
	  $('#filter-'+fieldId).text(min+' - '+max);
	  self.model.queryState.replaceFilter({
	    type: 'range', 
	    field: fieldId, 
	    from: min,
	    to: max
	  });
	  self.model.query();
	}
      });
      $('#filter-'+field.field).text(filterMin+' - '+filterMax);
    });
  }
});
})(jQuery, recline.View);

