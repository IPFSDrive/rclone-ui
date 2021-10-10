import React, {Component} from 'react';
import {NavLink} from 'react-router-dom';
import {Button, Nav, NavItem} from 'reactstrap';
import PropTypes from 'prop-types';

import {AppNavbarBrand, AppSidebarToggler} from '@coreui/react';
// import logo from '../../assets/img/brand/logo.png'
//修改login
import logo from '../../assets/img/brand/Logo_write_png.png'
import favicon from '../../assets/img/brand/favicon.png'
import BackendStatusCard from "../../views/Base/BackendStatusCard/BackendStatusCard";

const propTypes = {
  children: PropTypes.node,
};

const defaultProps = {};

class DefaultHeader extends Component {
  render() {

    // eslint-disable-next-line
    const {children, ...attributes} = this.props;

    return (
      <React.Fragment>
        <AppSidebarToggler className="d-lg-none" display="md" mobile/>
        <AppNavbarBrand
          full={{src: logo, width: 1341 * 0.1, height: 419 * 0.1, alt: 'Rclone Logo'}}
          // minimized={{src: favicon, width: 30, height: 30, alt: 'Rclone Logo'}}
        />

        {/*去掉:远程左侧*/}
        {/*<AppSidebarToggler className="d-md-down-none" display="lg"/>*/}

        {/*去掉:Dashboard*/}
        {/*<Nav className="d-md-down-none" navbar>*/}
        {/*    <NavItem className="px-3">*/}
        {/*        <NavLink to="/dashboard" className="nav-link">Dashboard</NavLink>*/}
        {/*    </NavItem>*/}

        {/*去掉:监听数据*/}
        {/*</Nav>*/}
        {/*<Nav className="ml-auto" navbar>*/}
        {/*  <BackendStatusCard mode={"button"}/>*/}
        {/*</Nav>*/}

        <Nav className="ml-auto" navbar>
          <Button color="link" style={{color: "#ffffff"}} onClick={() => {
            window.location.reload()
          }}>Refresh</Button>
        </Nav>

      </React.Fragment>
    );
  }
}

DefaultHeader.propTypes = propTypes;
DefaultHeader.defaultProps = defaultProps;

export default DefaultHeader;
