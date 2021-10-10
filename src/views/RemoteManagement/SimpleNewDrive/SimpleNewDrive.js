import React from 'react';
import {Button, Card, CardBody, Col, Collapse, Container, FormFeedback, FormGroup, Input, Label, Row} from "reactstrap";
// import {config} from "./config.js";
import NewDriveAuthModal from "../../Base/NewDriveAuthModal";
import axiosInstance from "../../../utils/API/API";
import {
    findFromConfig,
    isEmpty,
    validateDriveName,
    validateDuration,
    validateInt,
    validateSizeSuffix
} from "../../../utils/Tools";
import ProviderAutoSuggest from "./ProviderAutoSuggest";
import {toast} from "react-toastify";
import * as PropTypes from 'prop-types';
import {getProviders} from "../../../actions/configActions";
import {connect} from "react-redux";
import {NEW_DRIVE_CONFIG_REFRESH_TIMEOUT} from "../../../utils/Constants";
import ErrorBoundary from "../../../ErrorHandling/ErrorBoundary";
import urls from "../../../utils/API/endpoint";

import arrow from '../../../assets/img/arrow.png';
import arrowDown from '../../../assets/img/arrow-down.png';

/**
 * Returns a component with set of input, error for the drivePrefix.
 * The input type changes based on config.Options.Type parameter. see code for details.
 * @param drivePrefix   {string}    Name of the remote in the config.
 * @param loadAdvanced  {boolean}   Load or skip the advanced options from the config options.
 * @param changeHandler {function}  This function is called once the value changes
 * @param currentValues {$ObjMap}   This map denotes current updated values for the parameters.
 * @param isValidMap    {$ObjMap}   This map denotes whether the parameter value is valid. This should be set by the changeHandler.
 * @param errorsMap     {$ObjMap}   This map contains string errors of each parameters.
 * @param config        {$ObjMap}   This map contains the actual parameter list and Options for all the providers.
 * @returns             {Array|*}   JSX array with parameter formGroups.
 * @constructor
 */
function DriveParameters({drivePrefix, loadAdvanced, changeHandler, currentValues, isValidMap, errorsMap, config}) {
    if (drivePrefix !== undefined && drivePrefix !== "") {
        const currentProvider = findFromConfig(config, drivePrefix);
        let outputMap = [];
        if (currentProvider !== undefined) {
            const inputsMap = currentProvider.Options;

            // console.log("current values" + currentValues);

            /* Options format is as follows
            {
                        "Advanced": true,
                        "Default": -1,
                        "DefaultStr": "off",
                        "Help": "If Object's are greater, use drive v2 API to download.",
                        "Hide": 0,
                        "IsPassword": false,
                        "Name": "v2_download_min_size",
                        "NoPrefix": false,
                        "Provider": "",
                        "Required": false,
                        "ShortOpt": "",
                        "Type": "SizeSuffix",
                        "Value": null,
                        "ValueStr": "off"
                    },

            */

            outputMap = inputsMap.map((attr, idx) => {
                if (attr.Hide === 0 && ((loadAdvanced && attr.Advanced) || (!loadAdvanced && !attr.Advanced))) {
                    const labelValue = `${attr.Help}`;
                    const requiredValue = ((attr.Required) ? (<i className={"text-red"}>*</i>) : null);

                    const hasExamples = !isEmpty(attr.Examples);
                    let examplesMap = null;

                    let inputType = "";


                    if (attr.IsPassword) {
                        inputType = "password";
                    } else if (hasExamples) {
                        inputType = "string";
                        // examplesMap = attr.Examples.map((ex1, id1) => {
                        //     return (<option key={"option" + id1} value={ex1.Value}>{ex1.Help}</option>);
                        // })
                    } else if (attr.Type === "bool") {
                        inputType = "select";
                        examplesMap = [
                            (<option key={1} value={true}>Yes</option>),
                            (<option key={2} value={false}>No</option>)
                        ];
                    } else {
                        // TODO: Write logic for SizeSuffix, Duration, int
                        if (attr.Type === "int") {
                            inputType = "number";
                        } else if (attr.Type === "string") {
                            inputType = "text";
                        } else {
                            inputType = "text";
                        }

                    }
                    return (
                        <FormGroup key={idx} row>
                            <Label for={attr.Name} sm={5}>{labelValue}{requiredValue}</Label>
                            <Col sm={7}>
                                <Input type={inputType} value={currentValues[attr.Name]}
                                       name={attr.Name} valid={isValidMap[attr.Name]} invalid={!isValidMap[attr.Name]}
                                       id={attr.Name} onChange={changeHandler} required={attr.Required}>
                                    {examplesMap}
                                </Input>
                                <FormFeedback>{errorsMap[attr.Name]}</FormFeedback>

                            </Col>
                        </FormGroup>
                    );
                } else {
                    return null;
                }
            });
        }
        return outputMap;
    }
    return (
        <div>Select a drive type to continue</div>
    );
}

// function DriveTypes({config}) {
//     // console.log(config);
//     let configMap = config.map((drive, idx) => (
//         <option key={drive.Prefix} value={idx}>{drive.Description}</option>
//     ));
//     return configMap;
// }


/**
 * Functional Component. Custom input for selecting a new name for the current config.
 * @param key           {string}    Contains the key to be used as the react key parameter in an array
 * @param id            {string}    Id to be used as a HTML id.
 * @param label         {string}    Label of the form input
 * @param changeHandler {function}  Called when the input changes.
 * @param type          {string}    Type of the input (ReactStrap supported). Eg: select, text etc.
 * @param value         {string}    The current value of the input.
 * @param name          {string}    The html name for the input.
 * @param placeholder   {string}    Placeholder text for input.
 * @param isValid       {boolean}   If set, displays positive message, else displays error message.
 * @returns             {*}         Functional component.
 * @constructor
 */
function CustomInput({key, id, label, changeHandler, type, value, name, placeholder, isValid = false}) {
    return (
        <FormGroup key={key} row>
            <Label for={id} sm={5}>{label}</Label>
            <Col sm={7}>
                <Input type={type} value={value} name={name} placeholder={placeholder}
                       id={id} onChange={changeHandler} valid={isValid} invalid={!isValid} required/>
                <FormFeedback valid>Sweet! that name is available</FormFeedback>
                <FormFeedback>Sad! That name is already assigned or empty</FormFeedback>
            </Col>
        </FormGroup>);
}

/**
 * Component to create a new remote configuration.
 */
class NewDrive extends React.Component {

    constructor(props, context) {
        super(props, context);
        this.state = {

            colRconfig: true,
            colSetup: false,
            colAdvanced: false,
            driveName: "",
            driveNameS3: "",
            driveNameW3s: "",

            driveNameIsEditable: true,

            advancedOptions: false,
            formValues: {},
            formValuesValid: {},
            required: {},
            authModalIsVisible: false,

            drivePrefix: "",
            driveNameIsValid: false,
            formErrors: {driveName: ""},
            optionTypes: {},
            isValid: {},

            currentStepNumber: 1,

            isShowW3sItem: true,
            w3sTokenIsValid: true,
            w3sToken: '',
            isShowS3Item: false, // s3
            isShowAdvancedItem: false, // Advanced

            s3Key: '', //
            s3KeyIsValid: true,
            s3Secret: '', //
            s3SecretIsValid: true,
            s3StorageUrl: '', //
            s3StorageUrlIsValid: true,


        };
        this.configCheckInterval = null;
        // console.log("Params", this.props.match.params);
        this.handleSubmit = this.handleSubmit.bind(this);
        this.toggleAuthModal = this.toggleAuthModal.bind(this);
        this.startAuthentication = this.startAuthentication.bind(this);
        this.checkConfigStatus = this.checkConfigStatus.bind(this);
    }

    /**
     *
     * @param e {$ObjMap} Event of the toggle event.
     */
    toggle = (e) => {
        let name = e.target.name;

        this.setState({[name]: !this.state[name]})
    };

    // Returns true or false based on whether the config is created
    async checkConfigStatus() {
        const {driveName} = this.state;

        try {
            let res = await axiosInstance.post(urls.getConfigForRemote, {name: driveName});
            // console.log(res);

            if (!isEmpty(res.data)) {
                // Config is created, clear the interval and hide modal
                clearInterval(this.configCheckInterval);
                this.configCheckInterval = null;
                this.toggleAuthModal();
                // this.props.history.push('/dashboard');
                this.props.history.push('/Configs');
            }
        } catch (e) {
            // console.log(`Error occurred while checking for config: ${e}`);
            toast.error(`Error creating config. ${e}`, {
                autoClose: false
            });
        }
    }

    /**
     * Handle inoit change and set appropriate errors.
     * @param e
     */
    handleInputChange = (e) => {

        let inputName = e.target.name;
        let inputValue = e.target.value;
        const inputType = this.state.optionTypes[inputName];
        this.setState({
            formValues: {
                ...this.state.formValues,
                [inputName]: inputValue
            }
        });
        let validateResult = true;
        let error = "";
        if (inputType === "SizeSuffix") {
            validateResult = validateSizeSuffix(inputValue);
            if (!validateResult) {
                error = "The valid input is size( off | {unit}{metric} eg: 10G, 100M, 10G100M etc.)"
            }
        } else if (inputType === "Duration") {
            validateResult = validateDuration(inputValue);
            if (!validateResult) {
                error = "The valid input is time ({unit}{metric} eg: 10ms, 100m, 10h15ms etc.)"
            }
        } else if (inputType === "int") {
            validateResult = validateInt(inputValue);
            if (!validateResult) {
                error = "The valid input is int (100,200,300 etc)"
            }
        }

        if (this.state.required[inputName] && (!inputValue || inputValue === "")) {
            validateResult = false;
            if (!validateResult) {
                error += " This field is required";
            }
        }


        this.setState((prevState) => {
            return {
                isValid: {
                    ...prevState.isValid,
                    [inputName]: validateResult
                },
                formErrors: {
                    ...prevState.formErrors,
                    [inputName]: error
                },
            }
        });


    };

    /**
     * Update the driveType and then load the equivalent input parameters for that drive.
     * @param event     {$ObjMap} Event to be handled.
     * @param newValue  {string} new Value of the drive type.
     */
    changeDriveType = (event, {newValue}) => {

        const {providers} = this.props;

        let val = newValue;


        let availableOptions = {};
        let optionTypes = {};
        let isValid = {};
        let formErrors = {};
        let required = {};
        // let drivePrefix = "";
        // console.log("driveType change", val);
        if (val !== undefined && val !== "") {

            const currentConfig = findFromConfig(providers, val);
            if (currentConfig !== undefined) {

                currentConfig.Options.forEach(item => {

                    const {DefaultStr, Type, Name, Required, Hide} = item;
                    if (Hide === 0) {
                        availableOptions[Name] = DefaultStr;
                        optionTypes[Name] = Type;
                        required[Name] = Required;

                        isValid[Name] = !(Required && (!DefaultStr || DefaultStr === ""));

                        formErrors[Name] = "";
                    }
                });
            }
            this.setState({
                drivePrefix: val,
                formValues: availableOptions,
                optionTypes: optionTypes,
                isValid: isValid,
                formErrors: formErrors,
                required: required
            });
        } else {
            this.setState({drivePrefix: val})

        }
    };

    /**
     * Open second step of setting up the drive and scroll into view.
     */
    openSetupDrive = (e) => {
        if (e) e.preventDefault();
        this.setState({'colSetup': true});
        // this.setupDriveDiv.scrollIntoView({behavior: "smooth"});
    };

    /**
     *  toggle the step 3: advanced options
     */
    editAdvancedOptions = (e) => {
        this.setState({advancedOptions: !this.state.advancedOptions});
    };

    /**
     * Validate the form and set the appropriate errors in the state.
     * @returns {boolean}
     */
    validateForm() {
        //    Validate driveName and other parameters
        const {driveNameIsValid, drivePrefix, isValid} = this.state;
        let flag = true;

        if (!driveNameIsValid) {
            flag = false;
        }
        if (drivePrefix === "") {
            flag = false;
        }


        /*Check for validations based on inputType*/
        for (const [key, value] of Object.entries(isValid)) {
            if (!key || !value) {
                flag = false;
                break;
            }
        }

        return flag;
    }

    /**
     *  Show or hide the auth modal.
     */
    toggleAuthModal() {
        this.setState((state, props) => {
            return {authModalIsVisible: !state.authModalIsVisible}
        });
    }

    /**
     *  Show or hide the authentication modal and start timer for checking if the new config is created.
     */
    startAuthentication() {
        this.toggleAuthModal();
        // Check every second if the config is created
        if (this.configCheckInterval === null) {
            this.configCheckInterval = setInterval(this.checkConfigStatus, NEW_DRIVE_CONFIG_REFRESH_TIMEOUT);
        } else {
            console.error("Interval already running. Should not start a new one");
        }

    }

    /**
     *  Called when the config is successfully created. Clears the timout and hides the authentication modal.
     */
    stopAuthentication() {
        this.setState((state, props) => {
            return {authModalIsVisible: false}
        });
        clearInterval(this.configCheckInterval);

    }

    /**
     * Called when form action submit is to be handled.
     * Validate form and submit request.
     * */
    async handleSubmit(e) {
        e && e.preventDefault();
        // console.log("Submitted form");

        const {formValues, drivePrefix} = this.state;
        const {providers} = this.props;


        if (this.validateForm()) {

            if (drivePrefix !== undefined && drivePrefix !== "") {
                const currentProvider = findFromConfig(providers, drivePrefix);
                if (currentProvider !== undefined) {


                    const defaults = currentProvider.Options;

                    // console.log(config, formValues, defaults);

                    let finalParameterValues = {};


                    for (const [key, value] of Object.entries(formValues)) {

                        if (key === "token") {
                            finalParameterValues[key] = value;
                            continue;
                        }
                        const defaultValueObj = defaults.find((ele, idx, array) => {
                            // console.log(key, ele.Name, key === ele.Name);
                            return (key === ele.Name);
                        });
                        if (defaultValueObj) {

                            const {DefaultStr} = defaultValueObj;
                            if (value !== DefaultStr) {
                                // console.log(`${value} !== ${DefaultStr}`);
                                finalParameterValues[key] = value;
                            }
                        }

                    }


                    let data = {
                        parameters: finalParameterValues,

                        name: this.state.driveName,
                        type: this.state.drivePrefix
                    };


                    // console.log("Validated form");
                    this.startAuthentication();
                    try {
                        const {drivePrefix} = this.props.match.params;

                        if (!drivePrefix) {

                            await axiosInstance.post(urls.createConfig, data);
                            toast.info("Config created");
                        } else {
                            await axiosInstance.post(urls.updateConfig, data);
                            toast.info("Config Updated");
                        }

                    } catch (err) {
                        toast.error(`Error creating config. ${err}`, {
                            autoClose: false
                        });
                        this.stopAuthentication();
                    }

                }
            }
        } else {
            // if (!this.state.colSetup) {
            //     this.openSetupDrive();
            // }

            // if (this.state.advancedOptions && !this.state.colAdvanced) {
            //     this.openAdvancedSettings();
            // }
            toast.warn(`Check for errors before submitting.`, {
                autoClose: false
            });
        }
    }


    async handleSubmitW3s(e) {
        e && e.preventDefault();
        // console.log("Submitted form");

        const {formValues} = this.state;
        const {providers} = this.props;


        let  v=this.validateForm()
        console.log(v)
        if (true ) {


            let drivePrefix = "w3s";

            const currentProvider = findFromConfig(providers, drivePrefix);
            console.log(currentProvider)
            if (currentProvider !== undefined) {


                const defaults = currentProvider.Options;

                // console.log(config, formValues, defaults);

                let finalParameterValues = {};


                for (const [key, value] of Object.entries(formValues)) {

                    if (key === "token") {
                        finalParameterValues[key] = value;
                        continue;
                    }
                    const defaultValueObj = defaults.find((ele, idx, array) => {
                        // console.log(key, ele.Name, key === ele.Name);
                        return (key === ele.Name);
                    });
                    if (defaultValueObj) {

                        const {DefaultStr} = defaultValueObj;
                        if (value !== DefaultStr) {
                            // console.log(`${value} !== ${DefaultStr}`);
                            finalParameterValues[key] = value;
                        }
                    }

                }


                let data = {
                    parameters: finalParameterValues,

                    name: this.state.driveName,
                    type: this.state.drivePrefix
                };


                // console.log("Validated form");
                this.startAuthentication();
                try {
                    const {drivePrefix} = this.props.match.params;

                    await axiosInstance.post(urls.createConfig, data);
                    toast.info("Config created");


                } catch (err) {
                    toast.error(`Error creating config. ${err}`, {
                        autoClose: false
                    });
                    this.stopAuthentication();
                }

            }
        }

    }


    /**
     * Clears the entire form.
     * Clearing the driveName and drivePrefix automatically clears the inputs as well.
     * */
    clearForm = _ => {
        this.setState({driveName: "", drivePrefix: ""})
    };


    changeS3Key = value => {
        let valid = true
        if (!value || (value = value.trim()).length === 0) {
            valid = false
        }
        this.setState({
            s3Key: value || '',
            s3KeyIsValid: valid,
        })
    }


    changeW3sToken = value => {
        let valid = true
        if (!value || (value = value.trim()).length === 0) {
            valid = false
        }
        this.setState({
            w3sToken: value || '',
            w3sTokenIsValid: valid,
        })
    }
    changeS3Secret = value => {
        let valid = true
        if (!value || (value = value.trim()).length === 0) {
            valid = false
        }
        this.setState({
            s3Secret: value || '',
            s3SecretIsValid: valid,
        })
    }

    changeS3StorageUrl = value => {
        let valid = true
        if (!value || (value = value.trim()).length === 0) {
            valid = false
        }
        this.setState({
            s3StorageUrl: value || '',
            s3StorageUrlIsValid: valid,
        })
    }

    /**
     * Change the name of the drive. Check if it already exists, if not, allow to be changes, else set error.
     * */
    changeName = e => {
        const {driveNameIsEditable} = this.state;
        const value = e.target.value;
        if (driveNameIsEditable && validateDriveName(value)) {

            this.setState({driveName: value}, () => {

                if (value === undefined || value === "") {
                    this.setState({driveNameIsValid: false});
                } else {

                    axiosInstance.post(urls.getConfigForRemote, {name: value}).then((response) => {
                        let errors = this.state.formErrors;
                        let isValid = isEmpty(response.data);
                        if (isValid) {
                            errors["driveName"] = "";
                        } else {
                            errors["driveName"] = "Duplicate";

                        }
                        this.setState({formErrors: errors, driveNameIsValid: isValid});
                    });
                }

            });

        } else {
            this.setState((prevState) => ({formErrors: {...prevState.formErrors, "driveName": "Cannot edit name"}}))
        }
    };

    /**
     * Open the advanced settings card and scroll into view.
     * @param e
     */
    openAdvancedSettings = e => {
        if (this.state.advancedOptions) {
            this.setState({colAdvanced: true});
        } else {
            this.configEndDiv.scrollIntoView({behavior: "smooth"});
        }
    };


    /**
     * Check if the provider list is empty else request new providers list.
     * */

    componentDidMount() {
        const {drivePrefix} = this.props.match.params;

        if (!this.props.providers || this.props.providers.length < 1)
            this.props.getProviders();

        if (drivePrefix) {
            //Edit Mode
            this.setState({driveName: drivePrefix, driveNameIsValid: true, driveNameIsEditable: false});
            axiosInstance.post(urls.getConfigForRemote, {name: drivePrefix}).then(
                (res) => {
                    console.log(res);
                    this.changeDriveType(undefined, {newValue: res.data.type});

                    this.setState((prevState) => ({
                        formValues: {...prevState.formValues, ...res.data}
                    }))

                }
            )
        }
    }

    /**
     * Clear the intervals.
     * */

    componentWillUnmount() {
        clearInterval(this.configCheckInterval);
        this.configCheckInterval = null;
    }

    onW3sTokenSubmit = () => {
        console.log("in")
        // this.changeS3Key(this.state.s3Key)
        // this.changeS3Secret(this.state.s3Secret)
        // this.changeS3StorageUrl(this.state.s3StorageUrl)
        this.setState({}, () => {
            // s3数据
            // if (!this.state.s3KeyIsValid || !this.state.s3SecretIsValid || !this.state.s3StorageUrlIsValid) {
            //     return
            // }
            // 名称
            if (!this.state.driveNameIsValid) {
                return;
            }
            if (!this.state.w3sTokenIsValid) {
                return;
            }

            // 设置默认s3
            this.changeDriveType({}, {newValue: 'w3s'})
            // 设置秘钥
            // this.setState({isShowAdvancedItem: true})
            // this.gotoNextStep()

            // 设置值
            this.setState({
                formValues: {
                    ...this.state.formValues,
                    'env_auth': false,
                    'w3s_token': this.state.w3sToken,
                    'secret_access_key': this.state.s3Secret,
                    'w3s_server_url': "https://api.web3.storage",
                    // 'env_auth': false,
                    // 'access_key_id': this.state.s3Key,
                    // 'secret_access_key': this.state.s3Secret,
                    // 'endpoint': this.state.s3StorageUrl,
                    // 'acl': 'private',
                    // 'storage_class': 'STANDARD',
                }
            }, () => {
                console.log(this.state.formValues)
                // 提交
                this.handleSubmitW3s(null)
            });

        });
    }

    onS3Submit = () => {
        this.changeS3Key(this.state.s3Key)
        this.changeS3Secret(this.state.s3Secret)
        this.changeS3StorageUrl(this.state.s3StorageUrl)
        this.setState({}, () => {
            // s3数据
            if (!this.state.s3KeyIsValid || !this.state.s3SecretIsValid || !this.state.s3StorageUrlIsValid) {
                return
            }
            // 名称
            if (!this.state.driveNameIsValid) {
                return;
            }

            // 设置默认s3
            this.changeDriveType({}, {newValue: 's3'})
            // 设置秘钥
            // this.setState({isShowAdvancedItem: true})
            // this.gotoNextStep()

            // 设置值
            this.setState({
                formValues: {
                    ...this.state.formValues,
                    'env_auth': false,
                    'access_key_id': this.state.s3Key,
                    'secret_access_key': this.state.s3Secret,
                    'endpoint': this.state.s3StorageUrl,
                    'acl': 'private',
                    'storage_class': 'STANDARD',
                }
            }, () => {
                console.log(this.state.formValues)
                // 提交
                this.handleSubmit(null)
            });

        });
    };

    gotoNextStep = () => {
        // 添加名称检查
        if (!this.state.driveNameIsValid) {
            return;
        }

        const {currentStepNumber, advancedOptions} = this.state;
        if ((advancedOptions && currentStepNumber === 3) || (!advancedOptions && currentStepNumber === 2)) {
            this.handleSubmit(null);
        } else {
            this.setCurrentStep(currentStepNumber + 1);
        }
    };

    gotoPrevStep = () => {
        const {currentStepNumber} = this.state;
        this.setCurrentStep(currentStepNumber - 1);
    };


    setCurrentStep = (stepNo) => {
        this.setState({currentStepNumber: stepNo});

    };

    StepShowCase = ({currentStepNumber}) => {
        const buttonActiveClassName = "step-active";
        const stepTitles = [
            "Set up Remote Config",
            "Set up Drive",
            "Advanced Config"
        ];

        return (
            <Container className="timeline">
                <Row>
                    {stepTitles.map((item, idx) => {
                        idx += 1;
                        return (
                            <React.Fragment key={idx}>
                                <Col
                                    className={"text-center " + ((currentStepNumber === idx) ? buttonActiveClassName : "")}
                                    md={2} sm={4}>
                                    <button className="btn btn-step-count"
                                            onClick={() => this.setCurrentStep(idx)}>{idx}</button>
                                    <h4>{item}</h4>
                                </Col>
                                {idx !== stepTitles.length && <Col md={3} className={"d-none d-md-block"}>
                                    <div className="timeline-divider align-middle"></div>

                                </Col>}
                            </React.Fragment>
                        )
                    })}

                </Row>
            </Container>
        )

    }

    /* return (
            <div className="timeline">
                <span className="li complete">
                    <button className="btn btn-primary btn-step-count">1</button>
                    <div class="status">
                        <h4> Shift Created </h4>
                    </div>
                </span>
                <div className="timeline-divider"></div>
                <li className="li complete">
                    <div class="status">
                        <h4> Shift Created </h4>
                    </div>
                </li>
                <li className="li complete">
                    <div class="status">
                        <h4> Shift Created </h4>
                    </div>
                </li>
            </div>
       ) */

    onItemClick = (type) => {
        if (type === 'S3') {
            this.setState({isShowS3Item: !this.state.isShowS3Item})
            this.setState({isShowW3sItem: !this.state.isShowW3sItem})
        }
        if (type === 'w3s') {
            this.setState({isShowS3Item: !this.state.isShowS3Item})
            this.setState({isShowW3sItem: !this.state.isShowW3sItem})
        }

        if (type === 'Advanced') {
            this.setState({isShowAdvancedItem: !this.state.isShowAdvancedItem})
        }
    }


    onGetKeyClick = (e) => {
        const shell = window.require("electron").shell;
        shell.openExternal("https://www.ipfsdrive.com/docs#s3")
        e.preventDefault();
        // window.open("https://www.ipfsdrive.com/doce#getW3sToken", "_blank")
        // e.preventDefault()
    }

    onGetKeyClickW3s = (e) => {
        const shell = window.require("electron").shell;
        shell.openExternal("https://www.ipfsdrive.com/docs#getW3sToken")
        e.preventDefault();
        // window.open("https://www.ipfsdrive.com/docs#getW3sToken", "_blank")
        // e.preventDefault()
    }

    render() {
        const {
            drivePrefix,
            advancedOptions,
            driveName,
            driveNameS3,
            driveNameW3s,
            driveNameIsValid,
            currentStepNumber
        } = this.state;
        const {s3KeyIsValid, s3SecretIsValid, s3StorageUrlIsValid} = this.state
        const {s3Key, s3Secret, s3StorageUrl} = this.state

        const {w3sToken, w3sTokenIsValid} = this.state

        const {providers} = this.props;
        return (
            <div data-test="newDriveComponent">
                <ErrorBoundary>
                    {/*<CIcon name="cil-list" size="2xl"/>*/}
                    {/*<div className={["cui-chart"]}></div>*/}
                    <div>
                        {/*<img src={this.state.isShowS3Item ? arrowDown : arrow} style={{width: 20}}/>*/}

                        {this.state.isShowW3sItem && <i className='icon-arrow-down'/>}
                        {!this.state.isShowW3sItem && <i className='icon-arrow-right'/>}


                        <Button color="link" onClick={() => this.onItemClick('w3s')}>Web3 storage</Button>
                    </div>

                    {

                        this.state.isShowW3sItem ? <div>
                            <Card>
                                <CardBody>
                                    <CustomInput label="Name of this drive (For your reference)"
                                                 changeHandler={this.changeName} value={driveName}
                                                 placeholder={"Enter a name"} name="name" id="driveName"
                                                 isValid={driveNameIsValid}/>

                                    {/*<FormGroup row>*/}
                                    {/*  <Label for="driveType" sm={5}>Select</Label>*/}
                                    {/*  <Col sm={7}>*/}
                                    {/*    <ProviderAutoSuggest suggestions={providers} value={drivePrefix}*/}
                                    {/*                         onChange={this.changeDriveType}/>*/}
                                    {/*  </Col>*/}
                                    {/*</FormGroup>*/}

                                    <CustomInput label="API Token"
                                                 changeHandler={(e) => this.changeW3sToken(e.target.value)}
                                                 value={w3sToken}
                                                 placeholder={"Enter web3 storage token"} name="w3sToken"
                                                 id="w3sTokenName"
                                                 isValid={w3sTokenIsValid}/>

                                    {/*<CustomInput label="S3 Secret"*/}
                                    {/*             changeHandler={(e) => this.changeS3Secret(e.target.value)} value={s3Secret}*/}
                                    {/*             placeholder={"Enter a Secret"} name="s3Secret" id="s3SecretName"*/}
                                    {/*             isValid={s3SecretIsValid}/>*/}

                                    {/*<CustomInput label="S3 Storage Url"*/}
                                    {/*             changeHandler={(e) => this.changeS3StorageUrl(e.target.value)} value={s3StorageUrl}*/}
                                    {/*             placeholder={"Enter a Storage Url"} name="s3StorageUrl" id="s3StorageUrlName"*/}
                                    {/*             isValid={s3StorageUrlIsValid}/>*/}

                                    <div className="clearfix">
                                        <div className="float-right">
                                            <a href="javascript:void(0)" target="_blank" onClick={this.onGetKeyClickW3s}>Get
                                                Key From Storage
                                                Server</a>
                                            <Button className="ml-3 btn-blue"
                                                    onClick={this.onW3sTokenSubmit}>Submit</Button>
                                        </div>
                                    </div>
                                </CardBody>
                            </Card>
                        </div> : ''
                    }

                    <div>
                        {/*<img src={this.state.isShowS3Item ? arrowDown : arrow} style={{width: 20}}/>*/}
                        {this.state.isShowS3Item && <i className='icon-arrow-down'/>}
                        {!this.state.isShowS3Item && <i className='icon-arrow-right'/>}


                        <Button color="link" onClick={() => this.onItemClick('S3')}>S3 compatible</Button>
                    </div>

                    {
                        this.state.isShowS3Item ? <div>
                            <Card>
                                <CardBody>
                                    <CustomInput label="Name of this drive (For your reference)"
                                                 changeHandler={this.changeName} value={driveName}
                                                 placeholder={"Enter a name"} name="nameS3" id="driveName"
                                                 isValid={driveNameIsValid}/>

                                    {/*<FormGroup row>*/}
                                    {/*  <Label for="driveType" sm={5}>Select</Label>*/}
                                    {/*  <Col sm={7}>*/}
                                    {/*    <ProviderAutoSuggest suggestions={providers} value={drivePrefix}*/}
                                    {/*                         onChange={this.changeDriveType}/>*/}
                                    {/*  </Col>*/}
                                    {/*</FormGroup>*/}

                                    <CustomInput label="Key"
                                                 changeHandler={(e) => this.changeS3Key(e.target.value)} value={s3Key}
                                                 placeholder={"Enter a key"} name="s3Key" id="s3KeyName"
                                                 isValid={s3KeyIsValid}/>

                                    <CustomInput label="Secret"
                                                 changeHandler={(e) => this.changeS3Secret(e.target.value)}
                                                 value={s3Secret}
                                                 placeholder={"Enter a Secret"} name="s3Secret" id="s3SecretName"
                                                 isValid={s3SecretIsValid}/>

                                    <CustomInput label="Url"
                                                 changeHandler={(e) => this.changeS3StorageUrl(e.target.value)}
                                                 value={s3StorageUrl}
                                                 placeholder={"Enter a Storage Url"} name="s3StorageUrl"
                                                 id="s3StorageUrlName"
                                                 isValid={s3StorageUrlIsValid}/>

                                    <div className="clearfix">
                                        <div className="float-right">
                                            <a href="javascript:void(0)" target="_blank" onClick={this.onGetKeyClick}>Get
                                                Key From Storage
                                                Server</a>
                                            <Button className="ml-3 btn-blue" onClick={this.onS3Submit}>Submit</Button>
                                        </div>
                                    </div>
                                </CardBody>
                            </Card>
                        </div> : ''
                    }

                    <div>
                        {/*<img src={this.state.isShowAdvancedItem ? arrowDown : arrow} style={{width: 20}}/>*/}
                        {this.state.isShowAdvancedItem && <i className='icon-arrow-down'/>}
                        {!this.state.isShowAdvancedItem && <i className='icon-arrow-right'/>}
                        <Button color="link" onClick={() => this.props.history.push("/newdrive")}>
                            Advanced</Button>
                    </div>

                </ErrorBoundary>
            </div>);
    }
}

const mapStateToProps = state => ({
    /**
     * The list of all providers.
     */
    providers: state.config.providers
});

NewDrive.propTypes = {
    providers: PropTypes.array.isRequired,
    getProviders: PropTypes.func.isRequired,
    isEdit: PropTypes.bool.isRequired,
    driveName: PropTypes.string
};

NewDrive.defaultProps = {
    isEdit: false,
};

export default connect(mapStateToProps, {getProviders})(NewDrive);
