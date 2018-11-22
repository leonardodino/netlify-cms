import React from 'react';
import PropTypes from 'prop-types';
import { WidgetPreviewContainer } from 'netlify-cms-ui-default';

const MultiselectPreview = ({ value }) => (
  <WidgetPreviewContainer>{value}</WidgetPreviewContainer>
);

MultiselectPreview.propTypes = {
  value: PropTypes.node,
};

export default MultiselectPreview;
