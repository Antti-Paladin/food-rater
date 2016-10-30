(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var backend = "http://anttipaladin.pythonanywhere.com/";

var FoodView = React.createClass({displayName: "FoodView",
  
  // sets initial state
  getInitialState: function(){
    return { 
      weekMenu: {
      "monday" : {courses: [] },
      "tuesday" : {courses: [] },
      "wednesday" : {courses: [] },
      "thursday" : {courses: [] },
      "friday" : {courses: [] },
      "saturday" : {courses: [] },
      "sunday" : {courses: [] }
      },
      date: "",
      users: [],
      loaded: false,
      user: { label: "", value: "" },
      newUser: "",
      showModal: false
    };
  },

  componentDidMount: function() {
    var date = moment(new Date());
    let items = [];

    this.userRequest = $.get(backend + "get_users", function (users) {
        for (let i = 0; i < users.length; i++) {             
          items.push(
            {
              label: users[i],
              value: users[i]
            });   
        }
      });

    this.dataRequest = $.get(backend + "get_data/" + date.format("YYYY-MM-DD"), function (result) {

      this.setState({
          weekMenu: result,
          date: date,
          loaded: true,
          users: items
        });

    }.bind(this));
  },

  componentWillUnmount: function() {
    if(this.dataRequest) {
      this.dataRequest.abort();
    }
    
    if(this.userRequest) {
      this.userRequest.abort();
    }
  },

  shiftWeek: function(amount) {
    this.setState({ loaded: false });

      var date = this.state.date.add(amount * 7, 'days');

      this.dataRequest = $.get(backend + "get_data/" + date.format("YYYY-MM-DD"), function (result) {
        this.setState({
          weekMenu: result,
          date: date,
          loaded: true
        });
    }.bind(this));
  },

    selectUser: function(newUser) {
      if(newUser) {
        this.setState({ user: newUser })
      }
      else {
        this.setState({ user: {label: [""], value: [""]} })
      }
    },

  closeModal: function() {
    this.setState({ showModal: false });
  },

  openModal: function() {
    this.setState({ showModal: true });
  },

  getNewUserValidationState: function() {
    if(this.state.newUser.match(/^[a-z0-9]+$/i)) {
      return 'success';
    }
    return 'error';
  },

  handleNewUserChange: function(e) {
    this.setState({ newUser: e.target.value });
  },

  addUser: function(e) {
    e.preventDefault(); 
    if(this.getNewUserValidationState() === 'success') {

      for(var i=0; i<this.state.users.length; i++) {
        if(this.state.users[i].label === this.state.newUser || this.state.users[i].value === this.state.newUser) {
          return;
        }
      }

      var updatedUsers = this.state.users;
      updatedUsers.push({label: [this.state.newUser], value: [this.state.newUser]})

      this.setState(
        {
          user: { label: this.state.newUser, value: this.state.newUser },
          users: updatedUsers,
          showModal: false
        });
    }
  },

  render: function() {
    var defaultKey = parseInt(moment(new Date()).format('E'));

    return (
      React.createElement("div", null, 
        React.createElement(Loader, {loaded: this.state.loaded, className: "pull-left", top: "20%", left: "20%"}, 
          React.createElement(ReactBootstrap.Modal, {show: this.state.showModal, onHide: this.closeModal}, 
          React.createElement(ReactBootstrap.Modal.Header, {closeButton: true}, 
            React.createElement(ReactBootstrap.Modal.Title, null, "New User")
          ), 
          React.createElement(ReactBootstrap.Modal.Body, null, 
            React.createElement(ReactBootstrap.Form, {onSubmit: this.addUser}, 
              React.createElement(ReactBootstrap.FormGroup, {
                controlId: "newUserText", 
                validationState: this.getNewUserValidationState()}, 
          React.createElement(ReactBootstrap.FormControl, {
            type: "text", 
            value: this.state.newUser, 
            placeholder: "Username", 
            onChange: this.handleNewUserChange}), 
              React.createElement(ReactBootstrap.FormControl.Feedback, null), 
              React.createElement(ReactBootstrap.HelpBlock, null, "Username can only contain letters and numbers")
            )
          )
          )
        ), 

          React.createElement("div", {style: { "display": "inline-block", "minWidth": "200px", "maxWidth": "500px", "verticalAlign": "middle"}}, 
            React.createElement(Select, {name: "user-select", options: this.state.users, onChange: this.selectUser, placeholder: "Rate as...", value: this.state.user, newOptionCreator: this.createUser})
          ), 
          React.createElement("div", {style: { "display": "inline-block", "marginLeft": "2rem", "verticalAlign": "middle"}}, 
            React.createElement(ReactBootstrap.Button, {onClick: this.openModal}, "New User")
          ), 
          React.createElement(ReactBootstrap.Tabs, {defaultActiveKey: defaultKey, id: "week-tab", style: {"marginLeft": "2rem"}}, 
            React.createElement(ReactBootstrap.Tab, {eventKey: 1, title: "Monday"}, 
              React.createElement("div", null, 
                React.createElement(CourseTable, {courses: this.state.weekMenu.monday.courses, user: this.state.user.value})
              )
            ), 
            React.createElement(ReactBootstrap.Tab, {eventKey: 2, title: "Tuesday"}, 
              React.createElement("div", null, 
                React.createElement(CourseTable, {courses: this.state.weekMenu.tuesday.courses, user: this.state.user.value})
              )
            ), 
            React.createElement(ReactBootstrap.Tab, {eventKey: 3, title: "Wednesday"}, 
            React.createElement("div", null, 
                React.createElement(CourseTable, {courses: this.state.weekMenu.wednesday.courses, user: this.state.user.value})
              )
              ), 
            React.createElement(ReactBootstrap.Tab, {eventKey: 4, title: "Thursday"}, 
              React.createElement("div", null, 
                React.createElement(CourseTable, {courses: this.state.weekMenu.thursday.courses, user: this.state.user.value})
              )
            ), 
            React.createElement(ReactBootstrap.Tab, {eventKey: 5, title: "Friday"}, 
              React.createElement("div", null, 
                React.createElement(CourseTable, {courses: this.state.weekMenu.friday.courses, user: this.state.user.value})
              )
            ), 
            React.createElement(ReactBootstrap.Tab, {eventKey: 6, title: "Saturday"}, 
              React.createElement("div", null, 
                React.createElement(CourseTable, {courses: this.state.weekMenu.saturday.courses, user: this.state.user.value})
              )
            ), 
            React.createElement(ReactBootstrap.Tab, {eventKey: 7, title: "Sunday"}, 
              React.createElement("div", null, 
                React.createElement(CourseTable, {courses: this.state.weekMenu.sunday.courses, user: this.state.user.value})
              )
            )
          ), 
          React.createElement(ReactBootstrap.Button, {id: "prevButton", className: "pull-left", onClick: (e) => this.shiftWeek(-1)}, "Previous week"), 
          React.createElement(ReactBootstrap.Button, {id: "nextButton", className: "pull-left", onClick: (e) => this.shiftWeek(1), style: {"marginLeft": "75px"}}, "Next week")
        )
      )

    )
  }

});

var CourseRow = React.createClass({displayName: "CourseRow",
  postRating: function(rating) {
      this.rateRequest = $.post(backend + "rate", {"user": this.props.user, "score": rating, "course": this.props.course});
    },

  getInitialState: function(){
    return { 
      course: {
        prediction: "-",
        rating: ''
      },
      user: "",
      loaded: false
    };
  },

componentWillUnmount: function() {
  if(this.predictionRequest) {
    this.predictionRequest.abort();
  }
    
  if(this.rateRequest) {
    this.rateRequest.abort();
  }

  },

  componentDidUpdate: function(prevProps, prevState) {
    prevUser = prevProps.user ? prevProps.user : "";
    propsUser = this.props.user ? this.props.user : "";

    if(prevUser != propsUser) {
      if(this.state.course.rating.resetRating)  {
        this.state.course.rating.resetRating();
      }

      this.setState(
        {
          course: 
          {
            prediction: "-",
            rating: this.state.course.rating
          },
          loaded: false
        });


      //get previous and predicted ratings for user
      this.ratingRequest = $.post(backend + "get_ratings", { course: this.props.course, user: this.props.user }, function(result) {
        var currentRating = result.rating;

        // set rating without running callback
        this.state.course.rating.setRating(currentRating, false);

        this.setState(
        {
          course: 
          {
            prediction: parseFloat(result.prediction.toPrecision(2)),
            rating: this.state.course.rating
          },
          loaded: true
        });

      }.bind(this));
    }
  },

  componentDidMount: function() {
    //get previous and predicted ratings for user
    this.ratingRequest = $.post(backend + "get_ratings", { course: this.props.course, user: this.props.user }, function(result) {
        var el = this.ratingComponent;
        var currentRating = result.rating;
        var maxRating= 5;

        this.setState(
        {
          course: 
          {
            prediction: parseFloat(result.prediction.toPrecision(2)),

            //Rating instance
            rating: rating(el, currentRating, maxRating, this.postRating)
          },
          loaded: true
        });
    }.bind(this));
  },

  render: function() {
    return (
      React.createElement("tr", null, 
        React.createElement("td", {style: {"paddingLeft": "2rem"}}, this.props.course.title_fi), 
        React.createElement("td", {id: "predColumn", style: {"paddingLeft": "50px"}}, 
           this.state.loaded ? this.state.course.prediction : React.createElement("div", {className: "loaderCircle"})
        ), 
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
      courses: [],
      user: ""
    };
  },

  render: function() {
    var rows = [];
    var lastCategory = null;

    this.props.courses.forEach(function(course) {
      rows.push(React.createElement(CourseRow, {course: course, user: this.props.user}));
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
