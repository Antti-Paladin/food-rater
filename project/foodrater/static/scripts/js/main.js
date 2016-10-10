(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var backend = "http://localhost:5000/";

var FoodView = React.createClass({displayName: "FoodView",
  
  // sets initial state
  getInitialState: function(){
    return { 
      courses: []
    };
  },

componentDidMount: function() {
    this.serverRequest = $.get(backend + "get_data/2016-08-10", function (result) {
      this.setState({
        courses: result.courses
      });
    }.bind(this));
  },

componentDidUpdate: function() {
   
  },

  componentWillUnmount: function() {
    this.serverRequest.abort();
  },

  render: function() {
    return (
      React.createElement("div", null, 
        React.createElement("ul", {className: "nav nav-tabs"}, 
          React.createElement("li", {className: "list-inline"}, React.createElement("a", {href: "#"}, "Monday")), 
          React.createElement("li", {className: "list-inline"}, React.createElement("a", {href: "#"}, "Tuesday")), 
          React.createElement("li", {className: "list-inline"}, React.createElement("a", {href: "#"}, "Wednesday")), 
          React.createElement("li", {className: "list-inline"}, React.createElement("a", {href: "#"}, "Thursday")), 
          React.createElement("li", {className: "list-inline"}, React.createElement("a", {href: "#"}, "Friday")), 
          React.createElement("li", {className: "list-inline"}, React.createElement("a", {href: "#"}, "Saturday")), 
          React.createElement("li", {className: "list-inline"}, React.createElement("a", {href: "#"}, "Sunday"))
        ), 
        React.createElement(CourseTable, {courses: this.state.courses, style: {"paddingLeft": "50px"}}), 
        React.createElement("ul", {className: "pager"}, 
              React.createElement("li", {className: "previous list-inline pull-left"}, React.createElement("a", {href: "#"}, "Previous week")), 
              React.createElement("li", {className: "next list-inline pull-left", style: {"paddingLeft": "400px"}}, React.createElement("a", {href: "#"}, "Next week"))
        )
      )
    )
  }

});

var CourseRow = React.createClass({displayName: "CourseRow",
  postRating: function(rating) {
      $.post(backend + "rate", {"user": "None", "score": rating, "course": this.props.course});
    },

  getInitialState: function(){
    return { 
      course: {}
    };
  },

  componentDidMount: function() {
    // rating element
    var el = this.ratingComponent;

    // current rating, or initial rating
    var currentRating = 0;

    // max rating, i.e. number of stars you want
    var maxRating= 5;

    // rating instance
    var myRating = rating(el, currentRating, maxRating, this.postRating);
  },

  render: function() {
    return (
      React.createElement("tr", null, 
        React.createElement("td", {style: {"paddingLeft": "2rem"}}, this.props.course.title_fi), 
        React.createElement("td", {style: {"paddingLeft": "50px"}}, "3"), 
        React.createElement("td", {style: {"paddingLeft": "50px"}}, 
          React.createElement("div", {className: "c-rating", ref: (ref) => this.ratingComponent = ref})
        )
      )
    );
  }

});

var CourseTable = React.createClass({displayName: "CourseTable",
  getInitialState: function(){
    return { 
      courses: []
    };
  },

  render: function() {
    var rows = [];
    var lastCategory = null;

    this.props.courses.forEach(function(course) {
      rows.push(React.createElement(CourseRow, {course: course}));
    }.bind(this));
    return (
      React.createElement("table", null, 
        React.createElement("thead", null, 
          React.createElement("tr", null, 
            React.createElement("th", {style: {"paddingLeft": "2rem"}}, "Course"), 
            React.createElement("th", {style: {"paddingLeft": "50px"}}, "Predicted Rating"), 
            React.createElement("th", {style: {"paddingLeft": "50px"}}, "Your Rating")
          )
        ), 
        React.createElement("tbody", {style: {"paddingLeft": "50px"}}, rows)
      )
    );
  }
});

ReactDOM.render(
  React.createElement(FoodView, null),
  document.getElementById('main')
);

},{}]},{},[1]);
