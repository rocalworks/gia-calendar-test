import React, { Component } from 'react';
import moment from 'moment';
import 'react-dates/initialize';
import { DayPickerRangeController } from 'react-dates';
import 'react-dates/lib/css/_datepicker.css';
import { Button } from 'react-bootstrap';

let server_url = "http://api.rocalworks.space/calendar/data";

export default class App extends Component{
    constructor(props) {
        super(props);

        this.state = {
            startDate: null,
            endDate: null,
            focusedInput: null,
            blockedDates: {}
        };
    }

    componentDidMount() {
        //this.getCalendar();
    }

    isDayBlocked = (day) => {
        // TODO: Fetch blocked dates here.
        let blocked = [

        ];

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
            .then( response => { return response.text() })
            .then(  data => { console.log(data) });
    }

    createEvent(e) {
        e.preventDefault();

        let formData = new FormData(this.bookingForm);
        let params = {
            method: 'post',
            body: formData
        };

        fetch(server_url + '/create-event/', params)
            .then( response => { return response.text() })
            .then(  data => { console.log(data) });
    }

    render() {
        return(
            <div className="container">
                <DayPickerRangeController
                    startDate={this.state.startDate}
                    endDate={this.state.endDate}
                    onDatesChange={({ startDate, endDate }) => this.setState({ startDate, endDate })}
                    focusedInput={this.state.focusedInput}
                    onFocusChange={focusedInput => this.setState({ focusedInput })}
                    numberOfMonths={4}
                    isDayBlocked={this.isDayBlocked}
                />

            <form ref={(form) => { this.bookingForm = form } }>
                <input type="date" name="start_date" onChange={({ startDate }) => this.setState({ startDate })} />
                <input type="date" name="end_date" onChange={({ endDate }) => this.setState({ endDate })} />
                <Button bsSize="large" onClick={this.createEvent.bind(this)}>Submit</Button>
            </form>
        </div>
        );
    }
}
