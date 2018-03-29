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
            blockedDates: []
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

        // Verify if date is in blocked dates
        if ( this.isDateBlocked(formData) ) {
            // Throw error if
            console.log("Someone booked this already!");
            return;
        }

        let params = {
            method: 'post',
            body: formData
        };

        fetch(server_url + '/create-event/', params)
            .then( response => { return response.text() })
            .then(  data => { console.log(data) });

        this.getCalendar();
    }

    isDateBlocked(form) {
        // Extract FormData entries
        let startDate = "";
        let endDate = "";

        for (var entry of form.entries()) {
            if (entry[0] === "start_date") { startDate = moment(entry[1]); }
            else if (entry[0] === "end_date") {endDate = moment(entry[1]); }
        }

        // Get range
        let range = getRange(startDate, endDate);

        // Check if date is within blocked dates
        for(let i = 0; i < range.length; i++) {
            for(let j = 0; j < this.state.blockedDates.length; j++) {
                if (range[i].format('YYYY-MM-DD') === this.state.blockedDates[j].format('YYYY-MM-DD')) {
                    return true;
                }
            }
        }

        return false;
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
                    <input type="date" name="start_date" onChange={({ startDate }) => this.setState({ startDate })} />
                    <input type="date" name="end_date" onChange={({ endDate }) => this.setState({ endDate })} />
                    <Button bsSize="large" onClick={this.createEvent.bind(this)}>Submit</Button>
                </form>
                {calendarContainer}
            </div>
        );
    }
}
