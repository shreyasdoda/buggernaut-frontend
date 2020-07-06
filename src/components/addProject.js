import {Input, Button, Checkbox, Dropdown, Header, Confirm} from 'semantic-ui-react';
import CKEditor from '@ckeditor/ckeditor5-react';
import InlineEditor from '@ckeditor/ckeditor5-build-inline';
import React, { Component } from 'react';
import axios from 'axios';
import '../styles/form.css';
import MyUploadAdapter from "../uploadAdapter";
import "cropperjs/dist/cropper.min.css";
import Cropper from "cropperjs";

class AddProject extends Component {

    constructor(props) {
        super(props);
        this.original_image_reference = React.createRef();
        this.state={
            userList: [],
            editor_images: [],
            project_image: null,
            project_name: "",
            project_wiki: "",
            project_deployed: false,
            project_members: [],
            project_slug: "",
            slug_available:"",
            slug_valid: true,
            cropped_image_url: "https://react.semantic-ui.com/images/avatar/large/matthew.png",
            original_image_url:"",
            submit_loading: false,
            confirm_open: false,
            editorID: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
        }
    }

    componentDidMount() {

        axios({
            url: '/users',
            method: 'get',
            withCredentials: true
        }).then(
            (response) => {
                let arr = [];
                const ul = response.data;
                for(let user in ul){
                    let dict = {};
                    dict["key"] = user;
                    dict["value"] = ul[user]["pk"];
                    dict["text"] = ul[user]["full_name"];
                    arr.push(dict);
                }

                this.setState({
                    userList: arr
                })
            }
        );

        // const cropper = new Cropper(this.original_image_reference.current,{
        //     zoomable: false,
        //     scalable: false,
        //     aspectRatio: 1,
        //     crop: () => {
        //         alert("wor")
        //         const canvas = cropper.getCroppedCanvas();
        //         this.setState({cropped_image_url: canvas.toDataURL("image/png")});
        //     }
        // });

    }

    onProjectNameChange() {
        let value = document.getElementById("project-name").value.trim();
        let slug = value.replace(/\s+/g, '-').toLowerCase();
        let validator = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

        if(!validator.test(slug)){
            this.setState({
                slug_valid: false, project_name: value, project_slug: slug, slug_available: false
            });
            return;
        }else{
            this.setState({
                slug_valid: true,
            });
        }

        if(!(value === "") ){
            let url = '/projects/verify/?slug=' + slug;
            axios({
                method: 'get',
                url:url,
                withCredentials: true,
            }).then(
                (response) => {
                    let status = response.data["status"];
                    if(status === "Available"){
                        this.setState({
                            project_name: value, project_slug: slug, slug_available: true
                        });
                    } else {
                        this.setState({
                            project_name: value, project_slug: slug, slug_available: false
                        });
                    }
                }
            );
        } else {
            this.setState({
                project_name: value, project_slug: slug, slug_available: false
            });
        }

    }

    uploadImage = (e) => {
        let image = e.target.files[0];

        if(image){
            this.setState({
                project_image: image,
            });
            // // alert("running")
            // let container = document.getElementById("image-preview");
            // container.style.display = "flex";
            //
            // let extension = image.name.split('.').pop();
            // if(!(extension === "png" || extension === "jpg" || extension === "jpeg")){
            //     alert("Image is not mandatory, but if uploaded, must be of file type .jpeg, .png, or .jpg .");
            //     return;
            // }
            //
            // const reader = new FileReader();
            // reader.addEventListener("load", () => {
            //     console.log("in listener")
            //     console.log(reader.result)
            //     let res = reader.result;
            //     this.setState({
            //         project_image: image,
            //         original_image_url: res,
            //     })
            // });
            //
            // reader.readAsDataURL(image);

        } else{
            this.setState({
                project_image: null,
                original_image_url: "",
            });
            let container = document.getElementById("image-preview");
            container.style.display = null;
        }
    }

    submitForm() {
         this.setState({
            confirm_open: false,
        });

        let projectName = this.state.project_name;
        let projectSlug = this.state.project_slug;
        let projectMembers = this.state.project_members;
        let projectDeployed = this.state.project_deployed;
        let projectWiki = this.state.project_wiki;
        let slugAvailable = this.state.slug_available;
        let slugValid = this.state.slug_valid;
        if(!slugValid){
            alert("The generated slug is invalid.");
            return;
        }

        if(!slugAvailable){
            alert("A project with this slug already exists.");
            return;
        }
        if(projectMembers.length === 0) {
            alert("Team cannot have zero members");
            return;
        }
        if(projectWiki===""){
            alert("Project wiki cannot be blank");
            return;
        }
        if(projectName===""){
            alert("Project name cannot be blank");
            return;
        }

        if(this.state.project_image === null){
            let del = window.confirm("You have not uploaded an image, and a default image will be set." +
                "\nAre you ready to continue?");
            if(!del){return;}
        }
        let projectImage = this.state.project_image;

        let formData = new FormData();
        if(projectImage !== null) formData.append('image', projectImage);
        formData.append('title', projectName);
        formData.append('slug', projectSlug);
        formData.append('wiki', projectWiki);
        formData.append('deployed', projectDeployed);
        formData.append('editorID', this.state.editorID);

        for(let mem in projectMembers){
            formData.append("members", projectMembers[mem]);
        }

         this.setState({
            submit_loading: true,
        });

        axios({
            url: "/projects/",
            method: "post",
            withCredentials: "true",
            data: formData,
        }).then((response) =>{
            this.setState({
                submit_loading: false,
            });
            if(response["status"] === 201){
                window.location = "http://localhost:3000/dashboard";
            } else{
                alert(response["status"]);
            }
            console.log(response);
        }).catch((e) => {
            alert(e);
        });

        const deleteData = new FormData();
        deleteData.append('editorID', this.state.editorID)
        deleteData.append('urls', this.state.editor_images)

        axios({
            url:"/images/deleteRem/",
            method:"post",
            data: deleteData,
            withCredentials: true,
        }).then((response)=>{
            // console.log(response);
        }).catch((e) => {
            console.log(e);
        });

    }

    render() {
        return (
            <div className="form-content"> {/* index.css */}
                <Confirm
                    open={this.state.confirm_open}
                    cancelButton='No'
                    confirmButton="Yes"
                    onCancel={() => {this.setState({confirm_open: false,})}}
                    onConfirm={this.submitForm.bind(this)}
                />
                <Header as={'h3'} style={{marginBottom:"5px"}}>Project name:</Header>
                <Input
                    error={!this.state.slug_valid}
                    fluid
                    id='project-name'
                    placeholder="Buggernaut"
                    onChange={this.onProjectNameChange.bind(this)}
                    />

                <div className="form-input-meta-data"> {/* form.css */}
                    <p style={{marginRight:"5px"}}>Slug generated:</p>
                    {(!this.state.slug_valid && <p style={{color:"red"}}>{this.state.project_slug} &nbsp;SLUG INVALID!</p> ) || ((this.state.project_slug !== "" && this.state.project_slug != null )  &&
                        (this.state.slug_available && <p style={{color:"green"}}>{this.state.project_slug} &nbsp;SLUG AVAILABLE! :)</p>
                    || <p style={{color:"red"}}>{this.state.project_slug} &nbsp;SLUG UNAVAILABLE :(</p>))}
                </div>



                <Header as={'h3'} style={{marginBottom:"5px"}}>Project wiki:</Header>
                <div className="form-ckeditor-input"> {/* index.css*/}
                    <CKEditor
                        id="project-wiki"
                        editor={InlineEditor}
                        config={{
                            placeholder: "Instructions on how to use the app...",
                            height: "100px",
                        }}
                        onInit={editor=>{
                                const editorID = this.state.editorID
                                editor.plugins.get('FileRepository').createUploadAdapter = function(loader){
                                    return new MyUploadAdapter(loader, editorID);
                                }
                            }}
                        onChange={ ( event, editor ) => {
                                const editor_imgs = Array.from( new DOMParser().parseFromString( editor.getData(), 'text/html' )
                                        .querySelectorAll( 'img' ) )
                                        .map( img => img.getAttribute( 'src' ) )
                                this.setState({
                                    project_wiki: editor.getData(),
                                    editor_images: editor_imgs,
                                })
                            } }

                        />
                </div>


                <Header as={'h3'} style={{marginBottom:"5px"}}>Team Members:</Header>
                <Dropdown id="team-select"
                          placeholder='Members'
                          fluid multiple search selection
                          options={this.state.userList}
                          onChange={(event, data) =>{
                              // console.log(data.value);
                              this.setState({project_members: data.value });
                          }}/>


                <Header style={{marginTop:"25px"}} as={'h3'}>Upload Image:</Header>
                <input style={{marginTop:"0px"}} type="file" accept="image/*" id="image-upload" onChange={this.uploadImage}/>
                {/*<div className="image-preview" id="image-preview">*/}
                {/*            <div><img ref={this.original_image_reference} alt="Uploaded Image" src={this.state.original_image_url} id={"image-preview__original-image"} className="image-preview__original-image"/></div>*/}
                {/*            <div><img alt="Cropped Image" src={this.state.cropped_image_url} className="image-preview__cropped-image"/></div>*/}
                {/*</div>*/}

                <Checkbox id="deployed-or-not"
                          label='Project has already been deployed'
                          style={{marginTop:"25px"}}
                          onChange={(e, data) => {
                              this.setState({project_deployed: data.checked });
                          }}/>

                <div className="form-submit-button">
                   <Button
                       floated="left"
                       disabled={this.state.submit_loading}
                       loading={this.state.submit_loading}
                       secondary
                       onClick={() => {this.setState({confirm_open: true})}}>
                       Submit
                   </Button>
                </div>

            </div>

        );
    }
}

export default AddProject;