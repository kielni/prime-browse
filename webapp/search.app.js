// (c) Open Knowledge Foundation 2012. Dedicated to the public domain. Please
// use and reuse freely - you don't even need to credit (though a link back to
// ReclineJS.com is always appreciated)!

jQuery(function($) {
  var $el = $('.search-here');

  var dataset = new recline.Model.Dataset({
      url: 'http://kobuk:9200/prime/video',
      backend: 'elasticsearch'
  });

  // #### Custom template
  // 
  // Create a custom template for rendering the records
  var template = ' \
    <div class="record" id="record-{{id}}"> \
      <div class="poster"><img src="{{image_url}}"></div> \
      <div class="description"> \
        <h3> \
          <a href="{{amazon_url}}">{{title}}</a> \
          {{#year}}({{year}}){{/year}}\
        </h3> \
        <input type="checkbox" class="hide-button" id="hide-{{id}}" value="{{id}}"><label for="hide-{{id}}">X</label> \
        <input type="checkbox" {{#queueP}}checked{{/queueP}} name="queue-{{id}}" class="queue-button p" id="pq-{{id}}" data-value="{{id}}" value="P"><label for="pq-{{id}}" class="pq-label">P</label> \
        <input type="checkbox" {{#queueK}}checked{{/queueK}} name="queue-{{id}}" class="queue-button k" id="kq-{{id}}" data-value="{{id}}" value="K"><label for="kq-{{id}}" class="kq-label">K</label> \
        <p>{{Plot}}</p> \
        {{#Runtime}} \
        <p>Run time: {{Runtime}} minutes</p> \
        {{/Runtime}} \
        <p>{{#Genre}} {{.}} {{/Genre}}</p> \
        {{#Metascore}} \
        <p>Metascore <b>{{Metascore}}</b>  \
        {{/Metascore}} \
        {{#imdbID}} \
        <a href="http://www.imdb.com/title/{{imdbID}}/" target="_new">IMDB</a> Rating <b>{{imdbRating}}</b></p> \
        {{/imdbID}} \
      </div>\
      <div style="clear:both"></div>\
    </div> \
  ';

  // #### Set up the search View (using custom template)
  var searchView = new SearchView({
    el: $el,
    model: dataset,
    template: template 
  });
  searchView.render();

  dataset.queryState.set({size: 20 },{silent: true});
  dataset.queryState.set({sort: { 'imdbRating': { order: 'desc' } } },{silent: true});
  dataset.queryState.addFacet('queue', 2, true);
  dataset.queryState.addFacet('Genre', 20, true);
  dataset.queryState.addFilter({
    type: 'range', 
    field: 'year', 
    from: 1994,
    to: 2014
  });
  dataset.queryState.addFilter({
    not: 'true',
    type: 'term',
    field: 'hide',
    term: 'true'
    });
  dataset.query();
});


var SearchView = Backbone.View.extend({
  events: {
    'click .hide-button': 'onHide',
    'click .queue-button': 'onQueue',
    'click #sort-select': 'onSort'
  },
  initialize: function(options) {
    this.el = $(this.el);
    _.bindAll(this, 'render');
    _.bindAll(this, 'onHide');
    _.bindAll(this, 'onQueue');
    _.bindAll(this, 'onSort');
    this.recordTemplate = options.template;
    this.model.records.bind('reset', this.render);
    this.templateResults = options.template;
    this  .facetWidget = new recline.View.MultiFacetViewer({
      model: this.model
    });
    this.filterWidget = new recline.View.FilterViewer({
      model: this.model
    });
  },

  // overall template for this view
  template: ' \
    <div class="controls"> \
      <div class="query-here"></div> \
    </div> \
    <div class="total"><h2><span></span> movies</h2></div> \
    <div class="body"> \
      <div class="sidebar"> \
        <div id="sort"> \
          Sort by <select name="sort" id="sort-select"> \
            <option {{#sort}}imdbRating{{/sort}} value="imdbRating">IMDB rating\
            <option {{#sort}}Metascore{{/sort}} value="Metascore">Metascore \
            <option {{#sort}}year{{/sort}} value="year">newest \
            <option {{#sort}}_score{{/sort}} value="relevance">relevance \
          </select> \
        </div> \
        <div id="filters"></div> \
        <div id="facets"></div> \
      </div> \
      <div class="results"> \
        {{{results}}} \
      </div> \
    </div> \
    <div class="pager-here"></div> \
  ',

  assign: function(view, selector) {
    view.setElement(this.$(selector)).render();
  },

  // render the view
  render: function() {
    console.log('render');
    var results = '';
    var sortField = 'imdbRating';
    var filterSort = this.model.queryState.get('sort');
    if (!_.isUndefined(filterSort)) {
      var key = _.keys(filterSort)[0];
      sortField = key;
    }
    if (_.isFunction(this.templateResults)) {
      var results = _.map(this.model.records.toJSON(), this.templateResults).join('\n');
    } else {
      var tmpl = '{{#records}}' + this.templateResults + '{{/records}}'; 
      var json = this.model.records.toJSON();
      _.each(json, function(rec) {
	rec.queueP = (!_.isUndefined(rec.queue) && _.contains(rec.queue, 'P'));
	rec.queueK = (!_.isUndefined(rec.queue) && _.contains(rec.queue, 'K'));
      });
      var results = Mustache.render(tmpl, {
        records: json,
	selectedSortField: sortField,
	sort: function() {
          return function(option) {
            return (option == this.selectedSortField) ? 'selected' : '';
          }
      }

      });
    }
    var html = Mustache.render(this.template, {
      results: results
    });
    this.el.html(html);
    $('.hide-button').button();
    $('.queue-button').button();

    this.el.find('.total span').text(this.model.recordCount);

    this.assign(this.facetWidget, '#facets');
    this.assign(this.filterWidget, '#filters');

    var pager = new recline.View.Pager({
      model: this.model
    });
    this.el.find('.pager-here').append(pager.el);

    var queryEditor = new recline.View.QueryEditor({
      model: this.model.queryState
    });
    this.el.find('.query-here').append(queryEditor.el);
  },

  onSort: function(e) {
    e.preventDefault();
    var selectedSort = $("#sort-select").val();
    var sortBy = {};
    if (selectedSort == "_score") {
      sortBy = { "_score" : null };
    } else {
      sortBy[selectedSort] = { "order" : "desc" };
    }
    this.model.queryState.set({ sort : sortBy });
    this.model.query();
 },

  onHide: function(e) {
    e.preventDefault();
    var $target= $(e.target);
    var docId = $target.attr('value');
    var doc = { "hide" : true };
    this.model.update(doc, docId);
    $('#record-'+docId).hide();
  },

  onQueue: function(e) {
    e.preventDefault();
    var $target= $(e.target);
    $('label[for="'+$target.attr('id')+'"]').toggleClass('ui-state-active');
    var tags = new Array();
    $('input[name="'+$target.attr('name')+'"]:checkbox:checked').each(function(i){
      tags[i] = $(this).val();
    });
    var doc = { "queue" : tags };
    this.model.update(doc, $target.attr('data-value'));
  }

});

var templates = {
  // generic template function
  'generic': function(record) {
    var template = '<div class="record"> \
      <ul> \
       {{#data}} \
       <li>{{key}}: {{value}}</li> \
       {{/data}} \
     </ul> \
    </div> \
    ';
    var data = _.map(_.keys(record), function(key) {
      return { key: key, value: record[key] };
    });
    return Mustache.render(template, {
      data: data
    });
  }
}

