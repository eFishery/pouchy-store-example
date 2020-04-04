import React from "react";

import BaseComponent from "@/components/BaseComponent";
import LoginForm from "@/components/LoginForm";

class LoginPage extends BaseComponent {
  render() {
    return (
      <div className="container">
        <div className="row">
          <div className="col col-md-4 offset-md-4">
            <div className="card mt-4">
              <div className="card-body">
                <h5 className="card-title">Login</h5>

                <LoginForm doLogin={this.doLogin} />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  doLogin = async email => {
    const id = email
      .split("@")
      .shift()
      .replace(/\W/g, "");

    await this.props.userStore.editSingle({
      id,
      email
    });
  };
}

export default LoginPage;
