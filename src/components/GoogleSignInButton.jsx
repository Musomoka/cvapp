import { GoogleLogin } from '@react-oauth/google';

function GoogleSignInButton({ onSuccess, onError }) {
  return (
    <div className="google-btn-wrapper">
      <GoogleLogin
        onSuccess={(credentialResponse) => {
          onSuccess(credentialResponse.credential);
        }}
        onError={() => {
          onError('Google Sign-In failed. Please try again.');
        }}
        width="100%"
        text="continue_with"
        shape="rectangular"
        theme="outline"
        size="large"
      />
    </div>
  );
}

export default GoogleSignInButton;
