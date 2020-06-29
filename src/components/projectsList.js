import React, { Component } from 'react';
import axios from 'axios';
import {Card, Loader, Image} from "semantic-ui-react";
import 'moment-timezone';

class ProjectsList extends Component {

    constructor(props) {
        super(props);
        let initial_state = this.props;
        let append_state ={
            projects_list: null,
            isMobile: window.innerWidth <= 800,
        };
        this.state = {...initial_state, ...append_state};
    }

    onWindowResize(){
       this.setState({ isMobile: window.innerWidth <= 480 });
    }

    componentDidMount() {
        window.addEventListener('resize', this.onWindowResize.bind(this));
        this.getProjectsList();
    }

    componentWillMount() {
        window.removeEventListener('resize', this.onWindowResize.bind(this));
    }

    getProjectsList(){
            let url="/projects/?deployed=";
            if(this.state.project_status === "deployed"){
                url+="true";
            } else {
                url+="false";
            }

            axios({
                url: url,
                method: 'get',
                withCredentials: true,

            }).then((response) => {
                    this.setState({
                        projects_list: response.data,
                    });
                }
            ).catch( (e) => {
                alert(e);
            });

    }


    render() {

        if(this.state.projects_list === null){
            return(<div style={{display:"flex", flexDirection:"column", justifyContent:"center"}}><Loader active/></div>);
        }

        if(this.state.projects_list.length === 0){
            //SHOW NO ISSUES YET
            return (
                <div className="ui big header none-available">No projects yet...</div> // {/* index.css */}
            );
        }

        return (
                <div id={this.state.project_status+"-projects-list"} style={{marginTop:"30px"}}>
                    <Card.Group itemsPerRow={(this.state.isMobile) ? 1:4}> {/* CHANGE COLUMNS IN RESPONSIVE MODE*/}
                        { this.state.projects_list.map( (project, index) => {
                            return (
                                <Card key={index} href={"http://localhost:3000/projects/" + project["slug"]}>
                                    <Image src={project["image"]} wrapped ui={false} />
                                  <Card.Content>
                                      <Card.Header>
                                          {project["title"]}
                                      </Card.Header>
                                  </Card.Content>
                                </Card>
                            );
                        })}
                    </Card.Group>

                </div>

                       );
    }
}

export default ProjectsList;