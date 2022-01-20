const { auth } = require('@strapi/helper-plugin');

function getServiceUri() {
  return strapi.backendURL;
}

function getJwtToken() {
  return auth.getToken();
}

const getIsConfigured = () => {
  return fetch(
    `${getServiceUri()}/mux-video-uploader/mux-settings`,
    {
      method: "GET",
      headers: { 'Authorization': `Bearer ${getJwtToken()}` }
    }).then((response) => response.json())
}

const setMuxSettings = (body) => {
  return fetch(`${getServiceUri()}/mux-video-uploader/mux-settings`, {
    method: "POST",
    headers: { 'Authorization': `Bearer ${getJwtToken()}` },
    body
  });
}

const submitUpload = async (uploadInfo) => {
  const body = new FormData();
  body.append("title", uploadInfo.title);

  let submitUrl;
    
  if(uploadInfo.origin === 'from_url') {
    submitUrl = `${getServiceUri()}/mux-video-uploader/submitRemoteUpload`;

    body.append("url", uploadInfo.media);
  } else if(uploadInfo.origin === 'from_computer') {
    submitUrl = `${getServiceUri()}/mux-video-uploader/submitDirectUpload`;
  } else {
    throw new Error('Unable to determine upload origin');
  }

  const response = await fetch(submitUrl, {
    method: "POST",
    headers: { 'Authorization': `Bearer ${getJwtToken()}` },
    body
  });
  
  return await response.json();
}

const getMuxAssets = (searchVector, sortVector, start = 0, limit = 10) => {
  let search;

  switch(searchVector?.field) {
    case 'by_title': {
      search = `&filter=title:${searchVector.value}`;

      break;
    }
    case 'by_asset_id': {
      search = `&filter=asset_id:${searchVector.value}`;

      break;
    }
    default: {
      search = '';
    }
  }

  const sort = sortVector ? `&sort=${sortVector.field}&order=${sortVector.desc ? 'desc' : 'asc'}` : '';

  const url = `${getServiceUri()}/mux-video-uploader/mux-asset?start=${start}${sort}&limit=${limit}${search}`;

  return fetch(url, {
    method: "GET",
    headers: { 'Authorization': `Bearer ${getJwtToken()}` }
  }).then((response) => response.json());
};

const setMuxAsset = async (muxAsset) => {
  const url = `${getServiceUri()}/mux-video-uploader/mux-asset/${muxAsset.id}`;

  const response = await fetch(url, {
    method: "PUT",
    headers: {
      'Authorization': `Bearer ${getJwtToken()}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(muxAsset)
  });

  return await response.json();
};

const deleteMuxAsset = async (muxAsset) => {
  const body = new FormData();
  body.append("id", muxAsset.id.toString());
  body.append("asset_id", muxAsset.asset_id || '');
  body.append("upload_id", muxAsset.upload_id);
  body.append("delete_on_mux", "true");

  const url = `${getServiceUri()}/mux-video-uploader/deleteMuxAsset`;

  const response = await fetch(url, {
    method: "POST",
    headers: { 'Authorization': `Bearer ${getJwtToken()}` },
    body
  });

  return await response.json();
};

module.exports = {
  getIsConfigured,
  setMuxSettings,
  submitUpload,
  getMuxAssets,
  setMuxAsset,
  deleteMuxAsset
};