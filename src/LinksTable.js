import React, { Component } from 'react';
import moment from 'moment';

import { Box, DataTable, CheckBox } from 'grommet';

class LinksTable extends Component { 
    constructor(props) {
        super(props);
    }

    handleMore(event) {
        console.log(event);
    }

    render() {
        var rowProps = {};
        rowProps[this.props.selectedLink] = {
            background: "accent-1"
        }
        return(
            <Box>
                <DataTable
                    columns={[
                        {property: "linkid", header: "Short Code", search: true, sortable: false},
                        {property: "url", header: "URL", search: true, sortable: true},
                        {property: "creation_date", header: "Created", sortable: false, align: "end",
                        render: (datum) => <div>{moment(datum.creation_date).fromNow()}</div>
                        }
                    ]}
                    onClickRow={
                        event => {
                            this.props.selectLink(event.datum.linkid);
                        }
                    }
                    primaryKey="linkid" 
                    sortable
                    data={this.props.links}
                    rowProps={rowProps}
                    onSearch={(event) => {console.log(event)}}
                />
            </Box>
        )
    }
}

export default LinksTable