var backend = "http://anttipaladin.pythonanywhere.com/";

var FoodView = React.createClass({
  
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
      <div>
        <Loader loaded={this.state.loaded} className="pull-left" top="20%" left="20%" >
          <ReactBootstrap.Modal show={this.state.showModal} onHide={this.closeModal}>
          <ReactBootstrap.Modal.Header closeButton>
            <ReactBootstrap.Modal.Title>New User</ReactBootstrap.Modal.Title>
          </ReactBootstrap.Modal.Header>
          <ReactBootstrap.Modal.Body>
            <ReactBootstrap.Form onSubmit={this.addUser}>
              <ReactBootstrap.FormGroup
                controlId="newUserText"
                validationState={this.getNewUserValidationState()} >
          <ReactBootstrap.FormControl
            type="text"
            value={this.state.newUser}
            placeholder="Username"
            onChange={this.handleNewUserChange} />
              <ReactBootstrap.FormControl.Feedback />
              <ReactBootstrap.HelpBlock>Username can only contain letters and numbers</ReactBootstrap.HelpBlock>
            </ReactBootstrap.FormGroup>
          </ReactBootstrap.Form>
          </ReactBootstrap.Modal.Body>
        </ReactBootstrap.Modal>

          <div style={{ "display": "inline-block", "minWidth": "200px", "maxWidth": "500px", "verticalAlign": "middle"}} >
            <Select name="user-select" options={this.state.users} onChange={this.selectUser} placeholder="Rate as..."  value={this.state.user} newOptionCreator={this.createUser} />
          </div>
          <div style={{ "display": "inline-block", "marginLeft": "2rem", "verticalAlign": "middle"}}>
            <ReactBootstrap.Button onClick={this.openModal}>New User</ReactBootstrap.Button>
          </div>
          <ReactBootstrap.Tabs defaultActiveKey={defaultKey} id="week-tab" style={{"marginLeft": "2rem"}}>
            <ReactBootstrap.Tab eventKey={1} title="Monday">
              <div>
                <CourseTable courses={this.state.weekMenu.monday.courses} user={this.state.user.value} />
              </div>
            </ReactBootstrap.Tab>
            <ReactBootstrap.Tab eventKey={2} title="Tuesday">
              <div>
                <CourseTable courses={this.state.weekMenu.tuesday.courses} user={this.state.user.value} />
              </div>
            </ReactBootstrap.Tab>
            <ReactBootstrap.Tab eventKey={3} title="Wednesday">
            <div>
                <CourseTable courses={this.state.weekMenu.wednesday.courses} user={this.state.user.value} />
              </div>
              </ReactBootstrap.Tab>
            <ReactBootstrap.Tab eventKey={4} title="Thursday">
              <div>
                <CourseTable courses={this.state.weekMenu.thursday.courses} user={this.state.user.value} />
              </div>
            </ReactBootstrap.Tab>
            <ReactBootstrap.Tab eventKey={5} title="Friday">
              <div>
                <CourseTable courses={this.state.weekMenu.friday.courses} user={this.state.user.value} />
              </div>
            </ReactBootstrap.Tab>
            <ReactBootstrap.Tab eventKey={6} title="Saturday">
              <div>
                <CourseTable courses={this.state.weekMenu.saturday.courses} user={this.state.user.value} />
              </div>
            </ReactBootstrap.Tab>
            <ReactBootstrap.Tab eventKey={7} title="Sunday">
              <div>
                <CourseTable courses={this.state.weekMenu.sunday.courses} user={this.state.user.value} />
              </div>
            </ReactBootstrap.Tab>
          </ReactBootstrap.Tabs>
          <ReactBootstrap.Button id="prevButton" className="pull-left" onClick={(e) => this.shiftWeek(-1)}>Previous week</ReactBootstrap.Button>
          <ReactBootstrap.Button id="nextButton" className="pull-left" onClick={(e) => this.shiftWeek(1)} style={{"marginLeft": "75px"}}>Next week</ReactBootstrap.Button>
        </Loader>
      </div>

    )
  }

});

var CourseRow = React.createClass({
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
      <tr>
        <td style={{"paddingLeft": "2rem"}}>{this.props.course.title_fi}</td>
        <td id="predColumn" style={{"paddingLeft": "50px"}}>
          { this.state.loaded ? this.state.course.prediction : <div className="loaderCircle" /> }
        </td>
        <td style={{"paddingLeft": "50px"}}>
          <div className="c-rating" ref={(ref) => this.ratingComponent = ref}></div>
        </td>
      </tr>
    );
  }

});

var CourseTable = React.createClass({
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
      rows.push(<CourseRow course={course} user={this.props.user} />);
    }.bind(this));
    return (
      <table>
        <thead>
          <tr>
            <th style={{"paddingLeft": "2rem"}}>Course</th>
            <th style={{"paddingLeft": "50px"}}>Predicted Rating</th>
            <th style={{"paddingLeft": "50px"}}>Your Rating</th>
          </tr>
        </thead>
        <tbody style={{"paddingLeft": "50px"}}>{rows}</tbody>
      </table>
    );
  }
});

ReactDOM.render(
  <FoodView />,
  document.getElementById('main')
);