import React from "react";

import BaseComponent from "@/components/BaseComponent";

class Login extends BaseComponent {
  state = {
    email: ""
  };

  handleInputChange = event => {
    this.setState({
      email: (event.target.value || "").trim()
    });
  };

  handleSubmit = async event => {
    event.preventDefault();

    if (!this.state.email) {
      alert("gunakan email @gmail");
      return;
    }
    if (!this.state.email.endsWith("@gmail.com")) {
      alert("gunakan email @gmail.com");
      return;
    }

    await this.props.doLogin(this.state.email);
  };

  render() {
    return (
      <form onSubmit={this.handleSubmit}>
        <div className="form-group">
          <label forhtml="exampleInputEmail1">Email</label>
          <input
            type="text"
            className="form-control"
            value={this.state.email}
            placeholder="email@gmail.com"
            onChange={this.handleInputChange}
          />
        </div>
        <div className="form-group">
          <button type="submit" className="btn btn-primary">
            Submit
          </button>
        </div>
      </form>
    );
  }
}

export default Login;
