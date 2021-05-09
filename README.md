
## 소개

원 소스는 [Vditor](https://github.com/Vanessa219/vditor)입니다. 위지위그(wysiwyg), 타이포라(ir), 향상된 마크다운(sv) 모드를 지원합니다. 여기에 전통적인 마크다운(sv2) 모드를 추가한 버전입니다.

한국형 에디터에 대해서는 [Vditor-kr](https://kr.nest-js.com/vditor) 사이트를 방문해 주세요

## 필요한 기능들

* https://www.mdnice.com/ 와 같이 헤딩이나, 목록(lists)와 같은 곳에서 텍스트에 span이나 label등을 더 추가 필요함. (lute에서 변경필요)
* 일반적인 위지위그 기능을 지원하기 위한 마크다운 문법
  * font size, font, text color, background color 등을 위해서 []{:.intro.red.fontsize#id.class}
  * paragraph 에 대한 것은 []가 없을 때 {:.center}
  * https://github.com/syfxlin/xkeditor 에서는
    [CSS]{color:blue}
    [CSS]{background:#ddd|span}
    [CSS]{text-align:center} 와 같이 처리함.
  * lute의 https://github.com/88250/lute/issues/84 를 참조해서 수정 필요함.
* 시간에 따라 자동으로 darkmode로 변경하기
* 지원되지 않는 브라우저로 접속시 메시지 출력하기