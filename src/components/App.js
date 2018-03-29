import React, { Component } from 'react';
import moment from 'moment';
import 'react-dates/initialize';
import { DayPickerRangeController } from 'react-dates';
import 'react-dates/lib/css/_datepicker.css';
import { Button } from 'react-bootstrap';

// let server_url = "http://api.rocalworks.space/calendar/data";    // Cloud testing
let server_url = "http://localhost/calendar-api/data";           // Local testing
const getRange = function(start, end) {
    let range = [];

    while(start < end) {
        range.push(moment(start));
        start = start.add(1, 'days');
    }

    return range;
};


export default class App extends Component{
    constructor(props) {
        super(props);

        this.state = {
            startDate: null,
            endDate: null,
            focusedInput: null,
            blockedDates: [],
            bookingNotif: "Add some dates here."
        };
    }

    componentWillMount() {
        this.getCalendar();
    }

    isDayBlocked = (day) => {
        // TODO: Fetch blocked dates here.
        let blocked = this.state.blockedDates;

        // Block dates before today
        if (day.isBefore(moment())) {
            return true;
        }

        // Block unavailable dates (from fetched data)
        for (let i = 0; i < blocked.length; i++) {
            if (day.format('YYYY-MM-DD') === blocked[i].format('YYYY-MM-DD')) {
                return true;
            }
        }
        // Show available dates
        return false;
    }

    getCalendar() {
        let params = {
            method: 'get'
        };

        fetch(server_url + '/load-calendars/', params)
            .then( response => { return response.json() })
            .then( data => { this.toArray(data) });
    }

    toArray(ics) {
        let json = JSON.parse(ics);

        // Extract dates here ~
        let range = [];

        // Get range from start to end, then add them to the array
        json.forEach(function(entry) {
            // Grab start and end dates
            let start = moment(entry.DTSTART.date.substr(0, 10));
            let end = moment(entry.DTEND.date.substr(0, 10));

            // Get ranges
            range.push(...getRange(start, end));
            // range.push(moment(end));
        });

        // Last part would be this one.
        this.setState( () => {
            return {
                blockedDates: range
            }
        })
    }

    createEvent(e) {
        e.preventDefault();

        let formData = new FormData(this.bookingForm);
        let notif = this.validateDate(formData);

        // Verify if date is not empty
        if (notif !== "OK") {
            this.setState( () => {
                return {
                    bookingNotif: notif
                }
            });
            return;
        } else {
            this.setState( () => {
                return {
                    bookingNotif: "Dates are valid. Submitting to server..."
                }
            });
        }

        // Send data to the API server
        let params = {
            method: 'post',
            body: formData
        };

        fetch(server_url + '/create-event/', params)
            .then( response => { return response.text() })
            .then(  data => {
                this.setState( () => {
                    return {
                        blockedDates: [],
                        bookingNotif: "Booked successfully. Refreshing calendar..."
                    }
                });
                // Refresh page
                // TODO: Refresh calendar after 3 seconds
                setTimeout(function(){ window.location.reload() }, 3000);
            });
    }

    validateDate(form) {
        // Extract FormData entries
        let startDate = "";
        let endDate = "";

        for (var entry of form.entries()) {
            if (entry[0] === "start_date") { startDate = entry[1]; }
            else if (entry[0] === "end_date") {endDate = entry[1]; }
        }

        // VERIFY: Check if dates are empty
        if (startDate === "" || endDate === "") {
            return "ERROR: Dates are empty!";
        }

        // Convert dates into moments object
        let start = moment(startDate);
        let end = moment(endDate);

        // VERIFY: Check for reverse date range
        if (start > end) {
            return "ERROR: End date is greater than start date!";
        }

        // Get range
        let range = getRange(start, end);

        // Check if date is within blocked dates
        for(let i = 0; i < range.length; i++) {
            for(let j = 0; j < this.state.blockedDates.length; j++) {
                if (range[i].format('YYYY-MM-DD') === this.state.blockedDates[j].format('YYYY-MM-DD')) {
                    return "ERROR: Someone is already booked on this day!";
                }
            }
        }

        // Input is fine; ready for sending data
        return "OK";
    }

    render() {
        let calendarContainer = this.state.blockedDates.length > 0 ?
            <DayPickerRangeController
                startDate={this.state.startDate}
                endDate={this.state.endDate}
                onDatesChange={({ startDate, endDate }) => this.setState({ startDate, endDate })}
                focusedInput={this.state.focusedInput}
                onFocusChange={focusedInput => this.setState({ focusedInput })}
                numberOfMonths={4}
                isDayBlocked={this.isDayBlocked}
            /> :
            <div>Loading calendar ... </div>

        return(
            <div className="container">
                <form ref={(form) => { this.bookingForm = form } }>
                    <p style={{marginTop: 25 + "px"}}>{this.state.bookingNotif}</p>
                    <label style={{margin: "0 25px 0 25px"}}>Start date:</label>
                    <input type="date" name="start_date" onChange={({ startDate }) => this.setState({ startDate })} />
                    <label style={{margin: "0 25px 0 25px"}}>End date:</label>
                    <input type="date" name="end_date" onChange={({ endDate }) => this.setState({ endDate })} />
                    <Button bsSize="large" onClick={this.createEvent.bind(this)} style={{margin: "0 25px 0 25px"}}>Submit</Button>
                </form>
                <hr />
                {calendarContainer}
            </div>
        );
    }
}
