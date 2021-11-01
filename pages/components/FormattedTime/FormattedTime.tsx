import React from "react";
import moment from "moment";

export default class FormattedTime extends React.Component {
  render() {
    return (
      <div>
        {moment().format("LL")} at {moment().format("LTS")}
      </div>
    );
  }

  private interval: any;

  // this will update the date time from moment, every seconds (1000ms)
  // and it'll use the interval
  // after the component is mounted
  componentDidMount() {
    this.interval = setInterval(() => this.setState({}), 1000);
  }

  // this will clear the interval
  // after the component is unmounted
  componentWillUnmount() {
    clearInterval(this.interval);
  }
}
