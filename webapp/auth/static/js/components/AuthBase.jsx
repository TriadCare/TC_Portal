import React from 'react';
import { Link } from 'react-router';

const AuthBase = (props) => (
  <div>

    <nav className="pt-navbar pt-fixed-top .modifier" role="menubar">
      <div className="pt-navbar-group pt-align-left">
        <div className="titleBar__logo"></div>
      </div>
      <div className="pt-navbar-group pt-align-right">
        <Link
          to="/login"
          role="menuitem"
          className="pt-button pt-minimal nav__item"
          activeClassName="nav__item-active"
        >
          Login
        </Link>
        <Link
          to="/register"
          role="menuitem"
          className="pt-button pt-minimal nav__item"
          activeClassName="nav__item-active"
        >
          Register
        </Link>
        <span className="pt-navbar-divider nav-divider"></span>
        <Link
          to="/help"
          role="menuitem"
          className="pt-button pt-minimal nav__item"
          activeClassName="nav__item-active"
        >
          Help
        </Link>
      </div>
    </nav>

    <div className="baseContainer">{props.children}</div>

  </div>
);

AuthBase.propTypes = {
  children: React.PropTypes.object,
};

export default AuthBase;
