var backend = "http://localhost:5000/";

var FoodView = React.createClass({
  
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
      <div>
        <ul className="nav nav-tabs">
          <li className="list-inline"><a href="#">Monday</a></li>
          <li className="list-inline"><a href="#">Tuesday</a></li>
          <li className="list-inline"><a href="#">Wednesday</a></li>
          <li className="list-inline"><a href="#">Thursday</a></li>
          <li className="list-inline"><a href="#">Friday</a></li>
          <li className="list-inline"><a href="#">Saturday</a></li>
          <li className="list-inline"><a href="#">Sunday</a></li>
        </ul>
        <CourseTable courses={this.state.courses} style={{"paddingLeft": "50px"}} />
        <ul className="pager">
              <li className="previous list-inline pull-left"><a href="#">Previous week</a></li>
              <li className="next list-inline pull-left" style={{"paddingLeft": "400px"}}><a href="#">Next week</a></li>
        </ul>
      </div>
    )
  }

});

var CourseRow = React.createClass({
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
      <tr>
        <td style={{"paddingLeft": "2rem"}}>{this.props.course.title_fi}</td>
        <td style={{"paddingLeft": "50px"}}>3</td>
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
      courses: []
    };
  },

  render: function() {
    var rows = [];
    var lastCategory = null;

    this.props.courses.forEach(function(course) {
      rows.push(<CourseRow course={course} />);
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