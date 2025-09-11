import { Alert, Snackbar } from '@mui/material'
import React from 'react'

const SnackBar = ({ 
    errorAlert, 
    setErrorAlert, 
    sucessAlert, 
    setSucessAlert,
    sucessMessage,
    errorMessage

}: { 
    errorAlert: boolean, 
    setErrorAlert: React.Dispatch<React.SetStateAction<boolean>>, 
    sucessAlert?: boolean, 
    setSucessAlert?: React.Dispatch<React.SetStateAction<boolean>>
    sucessMessage: string,
    errorMessage: string
}) => {
  return (
    <div>
        <Snackbar
				open={sucessAlert}
				autoHideDuration={3000}
				onClose={() => setSucessAlert && setSucessAlert(false)}
				anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
			>
				<Alert className='PopUp' sx={{ fontSize: '1.10rem', paddingRight: '40px', marginTop: '10vh'}}>
					{sucessMessage}
				</Alert>
			</Snackbar>

			<Snackbar
				open={errorAlert}
				autoHideDuration={3000}
				onClose={() => setErrorAlert(false)}
				anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
			>
				<Alert className='PopUp' severity="error" sx={{ fontSize: '1.10rem', paddingRight: '40px', marginTop: '10vh' }}>
					{errorMessage}
				</Alert>
			</Snackbar>
    </div>
  )
}

export default SnackBar