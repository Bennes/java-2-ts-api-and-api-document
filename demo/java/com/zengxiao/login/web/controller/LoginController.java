package com.zengxiao.login.web.controller;

import com.zengxiao.base.web.dto.BaseResult;
import com.zengxiao.login.web.dto.LoginUser;
import com.zengxiao.login.web.dto.UserInfo;

/**
 * 登录用户相关接口
 */
@RestController
@RequestMapping("/common")
public class LoginController {
  /**
   * 用户登录
   * 
   * HttpServletRequest、HttpServletResponse在生成api时会被忽略
   */
  @RequestMapping(value = "/login", method = RequestMethod.POST)
  public BaseResult<Boolean> login(HttpServletRequest request, HttpServletResponse response,
      @RequestBody @Valid LoginUser loginUser) {
    return new BaseResult(true);
  }

  /**
   * 登录用户基础信息
   */
  @RequestMapping(value = "/user")
  public BaseResult<UserInfo> user() {
    return new UserInfo();
  }

}