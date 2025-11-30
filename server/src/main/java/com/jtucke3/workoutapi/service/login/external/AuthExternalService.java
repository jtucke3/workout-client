package com.jtucke3.workoutapi.service.login.external;

import com.jtucke3.workoutapi.config.JwtUtil;
import com.jtucke3.workoutapi.dao.login.IUserDao;
import com.jtucke3.workoutapi.dto.login.LoginRequestDTO;
import com.jtucke3.workoutapi.dto.login.LoginResponseDTO;
import com.jtucke3.workoutapi.dto.login.RegisterRequestDTO;
import com.jtucke3.workoutapi.dto.login.Verify2FARequestDTO;
import com.jtucke3.workoutapi.dto.user.UserDTO;
import com.jtucke3.workoutapi.service.login.internal.IAuthInternalService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class AuthExternalService implements IAuthExternalService {

    private final IAuthInternalService authInternalService;
    private final JwtUtil jwtUtil;
    private final IUserDao userDao;

    @Override
    public LoginResponseDTO login(LoginRequestDTO req) {
        return authInternalService.startLogin(req.email(), req.password());
    }

    @Override
    public UserDTO register(RegisterRequestDTO req) {
        return authInternalService.register(req);
    }

    @Override
    public LoginResponseDTO verify2fa(Verify2FARequestDTO req) {
        return authInternalService.verify2fa(req);
    }

    @Override
    public UserDTO getCurrentUser(String authorizationHeader) {
        if (authorizationHeader == null || !authorizationHeader.startsWith("Bearer ")) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Missing or invalid Authorization header");
        }

        String token = authorizationHeader.substring(7); // Remove "Bearer " prefix

        try {
            // Validate token and extract email
            jwtUtil.validateToken(token);
            String email = jwtUtil.extractEmail(token);

            // Get user data
            return userDao.findPublicByEmail(email)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid token: " + e.getMessage());
        }
    }
}