'use strict';

(function($) {
    $.fn.closest_descendent = function(filter) {
        var $found = $(),
            $currentSet = this; // Current place
        while ($currentSet.length) {
            $found = $currentSet.filter(filter);
            if ($found.length) break;  // At least one match: break loop
            // Get all children of the current set
            $currentSet = $currentSet.children();
        }
        return $found.first(); // Return first match of the collection
    }    
})(jQuery);

function JqQuestion(type, mode, title, data){
    var leThis = this;
    
    this.title = title;
    this.type = type;
    this.data = data !== undefined ? data : [];
    this.mode = mode !== undefined ? mode : 'rd'; //rd,edit,wr
    
    this.question = $('<li></li>');
    this.question.on('q-delete', function(){
        leThis.question.remove();
    });
    this.question.on('q-edit', function(){
        leThis.switchMode();
    });
    
    this.switchMode = function(){
        if(leThis.mode == 'rd'){
            leThis.mode = 'edit';
        } else if(leThis.mode == 'edit'){
            leThis.mode = 'rd';
        }
        
        if(leThis.type == 'choices' || leThis.type == 'checkboxes'){
            var items = leThis.question.closest_descendent('.inner-sortable-list').children();
            var arr = [];
            for(var i = 0 ; i < items.length ; ++i){
                arr.push($(items[i]).find(':text').val());
            }
            leThis.data = arr;
        }
        
        leThis.buildQuestion();
    };

    this.buildQuestion = function(){
        var wrapper = $('<div class="form-group"></div>'); 
        var ctrlGrp = $('<div class="jq-btn-grp text-center"></div>');
        var editBtn = $('<button type="button" class="btn btn-default btn-xs pull-right"><span class="glyphicon glyphicon-wrench"></span></button>');
        var deleteBtn = $('<button type="button" class="btn btn-default btn-xs pull-right"><span class="glyphicon glyphicon-remove"></span></button>');
        var qContainer = $('<div class="col-lg-11"></div>');
        
        editBtn.click(function(event){
            leThis.switchMode();
        });
        deleteBtn.click(function(){
            leThis.question.remove();
        });
        
        var qContent;
        if(this.mode == 'rd'){
            var titleTpl = '<span>'+((this.title !== undefined) ? this.title : 'Question Title') +'</span>';
            var typeTpl = leThis.generatePreview(leThis.type);        
            var tpl = titleTpl + ((typeTpl instanceof jQuery) ? typeTpl.html() : typeTpl);
            qContent = $(tpl);
            wrapper.addClass('jq-elem-container').addClass('drag-marker');
        } else if(this.mode == 'edit'){
            wrapper.addClass('jq-elem-container-edit').addClass('edit-mode');
            qContent = $('<form role="form" class="form-horizontal"></form>');
            
            var titleTpl = '<div class="form-group"><label class="col-lg-2 control-label">Title</label><div class="col-lg-10"><input type="text" class="form-control"';
            if(leThis.title === undefined){
                titleTpl += ' placeholder = "Question Title..."/>';
            } else {
                titleTpl += ' value = ' + leThis.title + ' />';
            }
            titleTpl += '</div></div>';
            
            var typeTpl = '<div class="form-group"><label class="col-lg-2 control-label">Type</label><div class="col-lg-10">';
            typeTpl += '<select class="type-selector">';
            typeTpl += '<option value="text" ' + (leThis.type == 'text' ? 'selected>' : '>') + ' Text</option>';
            typeTpl += '<option value="paragraph" ' + (leThis.type == 'paragraph' ? 'selected>' : '>') +' Paragraph Text</option>';
            typeTpl += '<option value="choices" ' + (leThis.type == 'choices' ? 'selected>' : '>') + ' Multiple Choices</option>';
            typeTpl += '<option value="checkboxes" ' + (leThis.type == 'checkboxes' ? 'selected>' : '>') +' Checkboxes</option>';
            typeTpl += '</select>';
            typeTpl += '</div></div>';
            
            var previewTpl = $(leThis.generatePreview(leThis.type));
            
            var doneBtn = $('<button class="btn btn-primary">Done</button>').click(function(){
                var t = $('.form-group .col-lg-10 .form-control', qContent).val();
                if(t !== undefined && t != ''){
                    leThis.title = t;
                } else {
                    leThis.title = undefined;
                }
                leThis.switchMode();
            });
            
            qContent.append(titleTpl, typeTpl, previewTpl, doneBtn);
            
            $('.type-selector', qContent).change(function(event){
                var type = event.currentTarget.value;
                if(type !== undefined){
                    $(qContent.children()[2]).replaceWith($(leThis.generatePreview(type)));
                } else {
                    console.error('unable to determine preview type');
                }
            });
        }
        
        wrapper.append(ctrlGrp.append(deleteBtn, editBtn), qContainer.append(qContent));
        this.question.empty();
        this.question.append(wrapper);
    }
    
    this.generatePreview = function(type){
        leThis.type = type;
        var preview;
        switch(type){
            case "text":
                preview = '<input type="text" class="form-control" disabled>';
                break;
            case "paragraph":
                preview = '<textarea class="form-control jq-form-desc" disabled></textarea>';
                break;
            case "choices":
            case "checkboxes":
                preview = $('<div class="form-group"><div>');
                var colGrp = $('<div class="col-lg-offset-2 col-lg-4"></div>');
                var draggableList = $('<ul class="nav nav-list inner-sortable-list options-container"></ul>');
                
                var htmlItems = '';
                if(leThis.data.length > 0){
                    for(var i = 0 ; i < leThis.data.length ; ++i){
                        htmlItems += leThis.makeItem(leThis.data[i]);
                    }
                } else {
                    htmlItems = leThis.makeItem('Option 1');
                }
                
                preview.append(colGrp.append(draggableList.append(htmlItems)));
                
                if(leThis.mode == 'edit'){
                    draggableList.sortable({
                        placeholder : 'inner-drag-placeholder',
                        handle : '.drag-marker',
                        opacity : 0.6,
                        helper : 'clone'
                    });
                                                    
                    $('.options-container', preview).on('click', '.add-item', function(event){
                        var container = $($(this).closest('ul'));
                        var items = container.children('li');
                        $(items[items.length - 1]).closest_descendent('label').append('<button type="button" class="close remove-item" aria-hidden="true">&times;</button>');
                        var name = 'Option ' + (items.length + 1);
                        container.append(leThis.makeItem(name));
                    });   
                    
                    $('.options-container', preview).on('click', '.remove-item', function(event){
                        var name = $(this).parent().find(':text').val();
                        
                        var optionsContainer = $($(this).closest('ul'));
                        var items = optionsContainer.children();
                        var toAdd = [];
                        var qData = [];
                        var pos = -1;
                        for(var i = 0 ; i < items.length ; ++i){
                            var item = items[i];
                            var txt = $(item).find(':text').val();
                            if(txt != name){
                                if(pos != -1 && ~txt.indexOf('Option')){
                                    var split = txt.split(" ");
                                    var cnt = parseInt(split[1]);
                                    $(item).find(':text').val('Option ' + (--cnt));
                                }
                                toAdd.push(item);
                                qData.push(txt);
                            } else {
                                pos = i;
                            }
                        }
                        optionsContainer.empty();
                        optionsContainer.append(toAdd);
                    });
                }
                break;
            default:break;
        }
        return preview;
    };
    
    this.makeItem = function(name){
        var tpl = '<li><div class="form-group form-inline">'
        if(leThis.mode == 'edit'){
            tpl += '<div class="drag-marker glyphicon glyphicon-move"></div>';
        }
        if(leThis.type == 'choices'){
           tpl += '<div class="radio"><label><input type="radio" disabled/>';
        } else if(leThis.type == 'checkboxes'){
           tpl += '<div class="checkbox"><label><input type="checkbox" disabled/>'; 
        }
        tpl += '<input type="text" value="'+name+'" ';
        if(leThis.mode != 'edit'){
            tpl += 'disabled';
        }
        tpl += ' /><button type="button" class="close add-item" aria-hidden="true">+</button></label></div></div></li>'
        return tpl;
    }
    
    this.addItem = function(itemName){
        var name = (itemName !== undefined) ? itemName : 'Option ' + (this.data.length+1);
        var pos = this.data.indexOf(name);
        if(!(~pos)){
            this.data.push(name);
        } else {
            //TODO signal this in UI or something
            console.warn('option name must be unique');
        }
    };
    
    this.drawItems = function(){
        var tpl = '';
        for(var i = 0 ; i < leThis.data.length ; ++i){
            tpl += '<div class="radio"><label><input type="radio" disabled/><input type="text" value="'+leThis.data[i]+'"/><button type="button" class="close add-item" aria-hidden="true">+</button>';
            if(i != leThis.data.length - 1){
                tpl += '<button type="button" class="close remove-item" aria-hidden="true">&times;</button>';
            }
            tpl += '</label></div>';
        }
        return tpl;
    };
    
    this.buildQuestion();
};

JqQuestion.prototype.constructor = JqQuestion;

JqQuestion.prototype.getTemplate = function(){
    return this.question;    
};

(function ($){
    var _htmlTitle = '<div class="form-group jq-container jq-title-container">' +   
                        '<div class="col-lg-11 jq-title">' +
                            '<input class="form-control" type="text" placeholder="Title..."> ' +
                            '<textarea class="form-control jq-form-desc" placeholder="Description..."></textarea>' + 
                        '</div>' + 
                    '</div>';
    var _htmlform = $('<form role="form" class="form-horizontal"></form>');
    var _questionsContainer = $('<ul class="nav nav-list sortable-list"></ul>');
    var _htmlAdd = '<div class="btn-group jq-btn-add">' +
                      '<button type="button" class="btn btn-default dropdown-toggle" data-toggle="dropdown">' +
                        'Add <span class="caret"></span>' +
                      '</button>' +
                      '<ul class="dropdown-menu" role="menu">' +
                        '<li><a type="text"><span class="glyphicon glyphicon-star"></span> Text</a></li>' +
                        '<li><a type="paragraph"><span class="glyphicon glyphicon-text-width"></span> Paragraph Text</a></li>' +
                        '<li><a type="choices"><span class="glyphicon glyphicon-list"></span> Multiple Choices</a></li>' +
                        '<li><a type="checkboxes"><span class="glyphicon glyphicon-check"></span> Checkboxes</a></li>' +
                      '</ul>'+
                    '</div>';
    var _jqForm = $('<div class="col-md-6 col-md-offset-3 jq-form-editor"></div>');
    
    var generateView = function(root){
        //TODO populate _questionsContainer if I have any questions specified as dataProvider.
        _htmlform.append(_htmlTitle, _questionsContainer, _htmlAdd);
        _jqForm.append(_htmlform);
        root.append(_jqForm);
    };
    
    var addMagic = function(root){
        $("ul.sortable-list").sortable({
            placeholder : 'drag-placeholder',
            handle : '.drag-marker',
            opacity : 0.6,
            helper : 'clone'
        });
        $(".jq-btn-add ul li a", root).click(function(event){
            //this refers to the clicked a.
            $(this).trigger("jq-add", this.type);
        });
    }
    
    $.fn.jqforms = function(){
        var leThis= this;
        generateView(this);
        addMagic(this);
        this.on("jq-add", function(event, qType){
            var tpl = undefined;
            switch(qType){
                case 'text':
                    tpl = new JqQuestion('text', 'edit').getTemplate();
                    break;
                case 'paragraph':
                    tpl = new JqQuestion('paragraph', 'edit').getTemplate();
                    break;
                case 'choices':
                    tpl = new JqQuestion('choices', 'edit', undefined).getTemplate();
                    break;
                case 'checkboxes':
                    tpl = new JqQuestion('checkboxes', 'edit', undefined).getTemplate();
                default: break;
            }
            if(tpl !== undefined){
                _questionsContainer.append(tpl);       
            }
        });
        return this;
    }
}(jQuery));

$(document).ready(function(){
//    $("ul.sortable-list").sortable({
//            placeholder : 'drag-placeholder',
//            handle : '.drag-marker',
//            opacity : 0.6
//        });
    
    $("#myForm").jqforms();
});