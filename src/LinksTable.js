import React, { Component } from 'react';

import { Box, DataTable, CheckBox } from 'grommet';

class LinksTable extends Component { 
    constructor(props) {
        super(props);
    }


    render() {
        return(
            <Box>
                <DataTable
                    columns={[
                        
                        {property: "linkid", header: "Short Code"},
                        {property: "url", header: "URL"},
                        {property: "creation_date", header: "Created"},
                        {property: "modified_date", header: "Modified"}
                    ]}
                    data={this.props.links}
                />
            </Box>
        )
    }
}

export default LinksTable