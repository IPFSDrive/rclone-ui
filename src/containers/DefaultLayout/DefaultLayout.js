import React, {Component, Suspense} from 'react';
import {Redirect, Route, Switch} from 'react-router-dom';
import {Container} from 'reactstrap';
import {getVersion} from "../../actions/versionActions";

import {
  AppBreadcrumb,
  AppFooter,
  AppHeader,
  AppSidebar,
  AppSidebarFooter,
  AppSidebarForm,
  AppSidebarHeader,
  AppSidebarMinimizer,
  AppSidebarNav,
} from '@coreui/react';
// sidebar nav config
import navigation from '../../_nav';
// routes config
import routes from '../../routes';
import {connect} from "react-redux";
import {AUTH_KEY, LOGIN_TOKEN} from "../../utils/Constants";
import ErrorBoundary from "../../ErrorHandling/ErrorBoundary";
import animatedLogo from "../../assets/img/brand/animatedlogo.gif";

import ImgRefresh from '../../assets/img_new/refresh.png'
import LogoAll from '../../assets/img_new/logo_all.png'
import LogoAll2 from '../../assets/img_new/logo_all_2.png'
import LogoAll3 from '../../assets/img_new/logo_all_2.png'
import LogoAll4 from '../../assets/img_new/logo_all_2.png'
import Logo0 from '../../assets/img_new/logo.png'

const shell = window.require("electron").shell;

// const DefaultAside = React.lazy(() => import('./DefaultAside'));
const DefaultFooter = React.lazy(() => import('./DefaultFooter'));
const DefaultHeader = React.lazy(() => import('./DefaultHeader'));


const VERSION_NAV_ITEM_ATTRS = {
  attributes: {
    onClick: (e) => {
      shell.openExternal("https://www.ipfsdrive.com/docs")
      e.preventDefault();
    }
  },
  class: 'mt-auto my-cursor-hand-bak my-version',
  // icon: 'cui-cog',
  // url: '#',
  active: false,
  variant: 'success'
}

class DefaultLayout extends Component {

  loading = () => <div className="animated fadeIn pt-1 text-center">Loading...</div>;

  get navConfig() {
    // console.log("this.props.version", this.props.version)
    return {
      items: [
        ...navigation.items,
      ]
    }
  }

  componentDidMount() {
    if (!localStorage.getItem(AUTH_KEY) || window.location.href.indexOf(LOGIN_TOKEN) > 0) {
      this.props.history.push('/login');
    } else {
      this.props.getVersion();
    }
  }

  render() {
    // console.log("isConnected, default layout", this.props.isConnected);
    return (


      <div className="app" data-test="defaultLayout">
        <ErrorBoundary>
          {/*修改:头部颜色*/}
          {/*去掉头部*/}
          {/*<AppHeader fixed className="my-banner">*/}
          {/*  <Suspense fallback={this.loading()}>*/}
          {/*    <DefaultHeader onLogout={e => this.signOut(e)}/>*/}
          {/*  </Suspense>*/}
          {/*</AppHeader>*/}
          <div className="app-body">
            <AppSidebar fixed display="lg">
              <AppSidebarHeader>
                <img src={LogoAll4} alt="" className="my-logo-size"/>
                {/*<img src={LogoAll3} alt="" className="my-logo-size"/>*/}
                {/*<img src={LogoAll2} alt="" className="my-logo-size"/>*/}
                {/*<img src={LogoAll} alt="" className="my-logo-size"/>*/}
                {/*<img src={Logo0} alt="" className="my-logo-size"/>*/}
              </AppSidebarHeader>
              <AppSidebarForm/>
              <Suspense fallback={this.loading()}>
                <AppSidebarNav navConfig={this.navConfig}>
                </AppSidebarNav>
                <div className="my-version">
                  <a href="#" onClick={(e) => {
                    const shell = window.require("electron").shell;
                    shell.openExternal("https://www.ipfsdrive.com/docs")
                    e.preventDefault();
                  }}>v1.3.11</a>
                </div>
              </Suspense>
              <AppSidebarFooter/>
              {/*去掉最小化*/}
              {/*<AppSidebarMinimizer/>*/}
            </AppSidebar>
            <main className="main my-main">
              {/*去掉:面包屑*/}
              <div className="my-AppBreadcrumb">
                <AppBreadcrumb appRoutes={routes}/>
                <div className="my-refresh">
                  <i className="icon-refresh" onClick={() => window.location.reload()}></i>
                  {/*<img src={ImgRefresh} alt="refresh"/>*/}
                  {/*-><img src="../../assets/img_new/refresh.png" alt=""/>||123*/}
                </div>
              </div>
              <Container fluid className="my-body">
                <Suspense fallback={this.loading()}>
                  <Switch>
                    {
                      routes.map((route, idx) => {
                        return route.component ? (
                          <Route
                            key={idx}
                            path={route.path}
                            exact={route.exact}
                            name={route.name}
                            render={props => (
                              <route.component {...props} />
                            )}/>
                        ) : (null);
                      })
                    }
                    {/*修改:默认显示Configs*/}
                    {/*<Redirect from="/" to="/dashboard"/>*/}
                    <Redirect from="/" to="/showconfig"/>
                  </Switch>
                </Suspense>
              </Container>
            </main>
          </div>
          {/*去掉底层*/}
          {/*<AppFooter>*/}
          {/*  <Suspense fallback={this.loading()}>*/}
          {/*    <DefaultFooter/>*/}
          {/*  </Suspense>*/}
          {/*</AppFooter>*/}
        </ErrorBoundary>
      </div>
    );
  }
}

const mapStateToProps = (state) => ({
  isConnected: state.status.isConnected,
  version: state.version,
});

export default connect(mapStateToProps, {getVersion})(DefaultLayout);
