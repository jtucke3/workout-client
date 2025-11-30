package com.jtucke3.workoutapi.service.login.external;

import com.jtucke3.workoutapi.dto.login.LoginRequestDTO;
import com.jtucke3.workoutapi.dto.login.LoginResponseDTO;
import com.jtucke3.workoutapi.dto.login.RegisterRequestDTO;
import com.jtucke3.workoutapi.dto.login.Verify2FARequestDTO;
import com.jtucke3.workoutapi.dto.user.UserDTO;

public interface IAuthExternalService {
    LoginResponseDTO login(LoginRequestDTO req);
    UserDTO register(RegisterRequestDTO req);
    LoginResponseDTO verify2fa(Verify2FARequestDTO req);
    UserDTO getCurrentUser(String authorizationHeader);
}