import React from 'react';
import PropTypes from 'prop-types';
import { WidgetPreviewContainer } from 'netlify-cms-ui-default';

const stringify = value => Array.isArray(value) ? value.join(', ') : value
const MultiselectPreview = ({ value }) => (
  <WidgetPreviewContainer>{stringify(value)}</WidgetPreviewContainer>
);

MultiselectPreview.propTypes = {
  value: PropTypes.array,
};

export default MultiselectPreview;
